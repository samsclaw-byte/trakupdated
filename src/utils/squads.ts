import { createClient } from "@/utils/supabase/client";

export type SquadEventType = 'perfect_day' | 'calorie_target_hit' | 'streak_5' | 'streak_10' | 'streak_21' | 'streak_50' | 'streak_100' | 'joined' | 'habit_completed' | 'workout_completed';

export async function logSquadEvent(userId: string, eventType: SquadEventType, metadata: Record<string, unknown> = {}) {
    const supabase = createClient();

    try {
        // 1. Find all squads this user is a part of
        const { data: userSquads, error: memberError } = await supabase
            .from('squad_members')
            .select('squad_id')
            .eq('user_id', userId);

        if (memberError || !userSquads || userSquads.length === 0) {
            return; // Not in any squads, or error
        }

        // 2. Prepare feed inserts for every squad
        const feedInserts = userSquads.map(s => ({
            squad_id: s.squad_id,
            user_id: userId,
            event_type: eventType,
            metadata: metadata
        }));

        // 3. Batch insert into the squad_feed
        await supabase.from('squad_feed').insert(feedInserts);

    } catch (error) {
        console.error("Failed to log squad event:", error);
    }
}
