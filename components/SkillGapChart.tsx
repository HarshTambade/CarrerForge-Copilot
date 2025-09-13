'use client';

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface SkillGapChartProps {
  currentSkills: Array<{ skill: string; level: number }>;
  requiredSkills: Array<{ skill: string; level: number }>;
  missingSkills: string[];
  matchPercentage: number;
}

export default function SkillGapChart({ 
  currentSkills, 
  requiredSkills, 
  missingSkills, 
  matchPercentage 
}: SkillGapChartProps) {
  // Prepare data for radar chart
  const chartData = requiredSkills.map(required => {
    const current = currentSkills.find(skill => 
      skill.skill.toLowerCase() === required.skill.toLowerCase()
    );
    
    return {
      skill: required.skill,
      current: current?.level || 0,
      required: required.level,
      gap: Math.max(0, required.level - (current?.level || 0))
    };
  });

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Skill Gap Analysis</span>
          </CardTitle>
          <CardDescription>
            Compare your current skills with job requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="skill" 
                    tick={{ fontSize: 12 }}
                    className="text-gray-600"
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 10]} 
                    tick={{ fontSize: 10 }}
                    className="text-gray-400"
                  />
                  <Radar
                    name="Your Skills"
                    dataKey="current"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Required"
                    dataKey="required"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Skills Summary */}
            <div className="space-y-4">
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMatchColor(matchPercentage)}`}>
                  {matchPercentage}% Match
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Overall skill compatibility with job requirements
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Your Strengths</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentSkills.slice(0, 6).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                        {skill.skill} ({skill.level}/10)
                      </Badge>
                    ))}
                  </div>
                </div>

                {missingSkills.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Skills to Develop</h4>
                    <div className="flex flex-wrap gap-2">
                      {missingSkills.slice(0, 6).map((skill, index) => (
                        <Badge key={index} variant="outline" className="border-red-200 text-red-700">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Skills Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Skills Breakdown</CardTitle>
          <CardDescription>
            Individual skill analysis and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((skill, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{skill.skill}</span>
                    <span className="text-sm text-gray-500">
                      {skill.current}/{skill.required}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full relative"
                      style={{ width: `${(skill.current / skill.required) * 100}%` }}
                    >
                      <div 
                        className="absolute top-0 right-0 h-2 bg-red-200 rounded-r-full"
                        style={{ width: `${(skill.gap / skill.required) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  {skill.gap > 0 ? (
                    <Badge variant="outline" className="border-orange-200 text-orange-700">
                      Gap: {skill.gap}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ✓ Met
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}