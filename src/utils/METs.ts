import { Activity, Dumbbell, Flame, Heart, PersonStanding, Timer, TrendingUp, Zap } from "lucide-react";

export type Intensity = "Light" | "Medium" | "Intense";

export interface ActivityDefinition {
    id: string;
    name: string;
    icon: React.ElementType;
    mets: {
        Light: number;
        Medium: number;
        Intense: number;
    };
}

export const ACTIVITIES: ActivityDefinition[] = [
    {
        id: "running",
        name: "Running",
        icon: Timer,
        mets: {
            Light: 6.0,  // Jogging ~5mph
            Medium: 9.8, // Running ~6mph
            Intense: 12.8, // Running ~8mph
        }
    },
    {
        id: "weightlifting",
        name: "Weightlifting",
        icon: Dumbbell,
        mets: {
            Light: 3.5,  // Light effort
            Medium: 5.0, // Moderate effort
            Intense: 6.0, // Vigorous effort, powerlifting
        }
    },
    {
        id: "cycling",
        name: "Cycling",
        icon: Activity,
        mets: {
            Light: 4.0,  // <10 mph
            Medium: 8.0, // 12-14 mph
            Intense: 10.0, // 14-16 mph
        }
    },
    {
        id: "swimming",
        name: "Swimming",
        icon: Zap,
        mets: {
            Light: 5.8,  // Leisurely
            Medium: 8.3, // Moderate pace
            Intense: 9.8, // Vigorous pace
        }
    },
    {
        id: "yoga",
        name: "Yoga / Pilates",
        icon: PersonStanding,
        mets: {
            Light: 2.0,  // Hatha
            Medium: 3.0, // Vinyasa / Flow
            Intense: 4.0, // Power Yoga
        }
    },
    {
        id: "hiit",
        name: "HIIT / Circuit",
        icon: Flame,
        mets: {
            Light: 6.0,
            Medium: 8.0,
            Intense: 11.0,
        }
    },
    {
        id: "walking",
        name: "Walking",
        icon: Heart,
        mets: {
            Light: 2.8,  // Leisure stroll
            Medium: 3.5, // Brisk
            Intense: 4.8, // Speed walking
        }
    },
    {
        id: "sports",
        name: "Sports",
        icon: TrendingUp,
        mets: {
            Light: 4.0,  // e.g. casual frisbee
            Medium: 7.0, // e.g. tennis
            Intense: 9.0, // e.g. competitive soccer/basketball
        }
    }
];

export function calculateCaloriesBurned(activityId: string, intensity: Intensity, durationMinutes: number, weightKg: number): number {
    const activity = ACTIVITIES.find(a => a.id === activityId);
    if (!activity) return 0;

    const metValue = activity.mets[intensity];
    const durationHours = durationMinutes / 60;

    // Standard MET formula: Calories = METs x Weight (kg) x Time (hours)
    const calories = metValue * weightKg * durationHours;

    return Math.round(calories);
}
