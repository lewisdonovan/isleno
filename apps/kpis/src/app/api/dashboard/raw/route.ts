import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import {
    getKpiGroups,
    getKpisByGroup,
    getActivities,
    getPointActivities,
    getLeadsFromCollaborators,
    fetchUsers
} from '@/lib/monday/services';


export async function GET(req: NextRequest) {

    const { success, session, error, status } = validateSession(req);
    if (!success || !session) {
        return NextResponse.json({ error }, { status });
    }


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
            fetchUsers(session),
            getKpiGroups(session),
            getActivities(session),
            getPointActivities(session, startDate, endDate),
            getLeadsFromCollaborators(session, { limit: 1, onlyFirst: true }),
        ]);

        // eslint-disable-next-line no-console
        const kpiItemsByGroup: Record<string, any[]> = {};
        for (const g of groups) {
            kpiItemsByGroup[g.id] = await getKpisByGroup(session, g.id);
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
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 500 }
        );
    }
}
