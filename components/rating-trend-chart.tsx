"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface RatingTrendChartProps {
    data: Array<{
        date: string;
        rating: number;
        goalTitle: string;
    }>;
}

export function RatingTrendChart({ data }: RatingTrendChartProps) {
    // Transform data for chart
    const chartData = data.map((item) => ({
        date: new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        }),
        rating: item.rating,
        goal: item.goalTitle,
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Rating Trend
                </CardTitle>
                <CardDescription>Your performance ratings over time</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis
                            domain={[0, 4]}
                            ticks={[1, 2, 3, 4]}
                            tickFormatter={(value) => {
                                switch (value) {
                                    case 4:
                                        return "Exceeds";
                                    case 3:
                                        return "Meets";
                                    case 2:
                                        return "Below";
                                    case 1:
                                        return "Needs Imp.";
                                    default:
                                        return "";
                                }
                            }}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                                            <p className="font-semibold">{data.goal}</p>
                                            <p className="text-sm text-muted-foreground">{data.date}</p>
                                            <p className="text-sm">
                                                Rating:{" "}
                                                {data.rating === 4
                                                    ? "Exceeds Expectations"
                                                    : data.rating === 3
                                                        ? "Meets Expectations"
                                                        : data.rating === 2
                                                            ? "Below Expectations"
                                                            : "Needs Improvement"}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="rating"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>

                {data.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No ratings yet. Ratings will appear here once your goals are rated.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
