import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock,
  Tags
} from "lucide-react";

import {
  AutoTagAnalytics as AnalyticsType,
  AutoTagRule,
  Transaction
} from "../types/AutoTagTypes";
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getPerformanceColor
} from "../utils/AutoTagHelpers";

interface AutoTagAnalyticsProps {
  analytics: AnalyticsType;
  rules: AutoTagRule[];
  transactions: Transaction[];
}

export function AutoTagAnalytics({ analytics, rules, transactions }: AutoTagAnalyticsProps) {
  const performanceMetrics = {
    highPerformers: rules.filter(r => (r.performance?.efficiency || 0) >= 90).length,
    needsReview: rules.filter(r => r.matches === 0).length,
    averageEfficiency: rules.length > 0
      ? Math.round(rules.reduce((sum, r) => sum + (r.performance?.efficiency || 0), 0) / rules.length)
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              High Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {performanceMetrics.highPerformers}
            </div>
            <p className="text-sm text-green-600 mt-1">
              Rules with 90%+ efficiency
            </p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Needs Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {performanceMetrics.needsReview}
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              Rules with no matches
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Average Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {performanceMetrics.averageEfficiency}%
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Across all rules
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rule Performance Details */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Rule Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules
              .filter(rule => rule.performance)
              .sort((a, b) => (b.performance?.efficiency || 0) - (a.performance?.efficiency || 0))
              .slice(0, 10)
              .map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{rule.name}</h4>
                      <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                        {rule.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{rule.matches} matches</span>
                      <span>
                        {rule.performance?.successfulApplications || 0} successful
                      </span>
                      <span>
                        {rule.performance?.failedApplications || 0} failed
                      </span>
                      {rule.lastRun && (
                        <span>Last run: {formatRelativeTime(rule.lastRun)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Efficiency</span>
                        <span className={getPerformanceColor(rule.performance?.efficiency || 0)}>
                          {rule.performance?.efficiency || 0}%
                        </span>
                      </div>
                      <Progress value={rule.performance?.efficiency || 0} className="h-2" />
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getPerformanceColor(rule.performance?.efficiency || 0)}`}>
                        {rule.performance?.efficiency || 0}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Category and Tag Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.categoryDistribution.slice(0, 8).map((category, index) => (
                <div key={category.category} className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium">
                    {category.percentage}%
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <Badge variant="outline">{category.category}</Badge>
                      <span className="text-sm text-gray-600">
                        {category.count} transactions
                      </span>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tag Usage */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="w-5 h-5" />
              Most Used Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.tagDistribution.slice(0, 8).map((tag, index) => (
                <div key={tag.tag} className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium">
                    {tag.percentage}%
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <Badge variant="outline">{tag.tag}</Badge>
                      <span className="text-sm text-gray-600">
                        {tag.count} uses
                      </span>
                    </div>
                    <Progress value={tag.percentage} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent AutoTag Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent AutoTag activity</p>
              <p className="text-sm">Run some rules to see activity here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      activity.action === 'both' ? 'bg-blue-100' :
                      activity.action === 'categorized' ? 'bg-green-100' :
                      'bg-purple-100'
                    }`}>
                      {activity.action === 'both' ? (
                        <Zap className="w-4 h-4 text-blue-600" />
                      ) : activity.action === 'categorized' ? (
                        <BarChart3 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Tags className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{activity.ruleName}</p>
                      <p className="text-sm text-gray-600">
                        {activity.changes.join(' • ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    {formatRelativeTime(activity.date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automation Insights */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Automation Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {analytics.automationRate}%
              </div>
              <p className="text-sm text-blue-700 font-medium">Automation Rate</p>
              <p className="text-xs text-blue-600 mt-1">
                {analytics.totalTransactionsTagged} of {analytics.totalTransactionsProcessed} transactions
              </p>
            </div>

            <div className="text-center p-4 rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {analytics.activeRules}
              </div>
              <p className="text-sm text-green-700 font-medium">Active Rules</p>
              <p className="text-xs text-green-600 mt-1">
                out of {analytics.totalRules} total rules
              </p>
            </div>

            <div className="text-center p-4 rounded-lg bg-purple-50">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {analytics.categoryDistribution.length}
              </div>
              <p className="text-sm text-purple-700 font-medium">Categories</p>
              <p className="text-xs text-purple-600 mt-1">
                automatically managed
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">💡 Optimization Tips</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {performanceMetrics.needsReview > 0 && (
                <li>• Review {performanceMetrics.needsReview} rules with no matches - they may need adjustment</li>
              )}
              {analytics.automationRate < 50 && (
                <li>• Create more rules to increase automation rate above 50%</li>
              )}
              {performanceMetrics.averageEfficiency < 80 && (
                <li>• Optimize rule conditions to improve average efficiency</li>
              )}
              <li>• Consider creating rules for frequently used categories: {analytics.categoryDistribution.slice(0, 3).map(c => c.category).join(', ')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}