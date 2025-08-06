import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getMondayToken } from '@/lib/auth';
import {
    getKpiGroups,
    getKpisByGroup,
    getActivities,
    getPointActivities,
    getLeadsFromCollaborators,
    fetchUsers
} from '@/lib/monday/services';


export async function GET(req: NextRequest) {

    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'No authenticated user' }, { status: 401 });
    }

    // Get Monday token for this user
    const mondayToken = await getMondayToken(user.id);
    if (!mondayToken) {
        return NextResponse.json(
            { error: 'No Monday.com token available' },
            { status: 401 }
        );
    }

    // Create a session-like object for the service functions
    const sessionLike = { 
        user: {
            id: user.id || '',
            email: user.email
        },
        accessToken: `Bearer ${mondayToken}`
    };

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json(
            { error: 'startDate and endDate query params are required' },
            { status: 400 }
        );
    }

    console.time('[rawDashboard] total');

    try {
        const [
            users,
            groups,
            activities,
            pointActivities,
            leads,
        ] = await Promise.all([
            fetchUsers(sessionLike),
            getKpiGroups(sessionLike),
            getActivities(sessionLike),
            getPointActivities(sessionLike, startDate, endDate),
            getLeadsFromCollaborators(sessionLike, { limit: 1, onlyFirst: true }),
        ]);

        const kpiItemsByGroup: Record<string, any[]> = {};
        for (const g of groups) {
            kpiItemsByGroup[g.id] = await getKpisByGroup(sessionLike, g.id);
        }

        console.timeEnd('[rawDashboard] total');

        return NextResponse.json({
            data: {
                period: `${startDate} to ${endDate}`,
                users,
                groups,
                kpiItemsByGroup,
                activities,
                pointActivities,
                leads,
            },
        });
    } catch (err) {
        console.error('[rawDashboard] error', err);
        
        // Check if it's a token expiration error
        if (err instanceof Error && err.message === 'MONDAY_TOKEN_EXPIRED') {
            return NextResponse.json(
                { error: 'MONDAY_TOKEN_EXPIRED' },
                { status: 401 }
            );
        }
        
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 500 }
        );
    }
}
