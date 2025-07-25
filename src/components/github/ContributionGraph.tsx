import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useGitHubContributions } from '@/hooks/useGitHubData';
import { GitHubComponentProps } from '@/types/github';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface ContributionGraphProps extends GitHubComponentProps {
  width?: number;
  height?: number;
  cellSize?: number;
  showTooltip?: boolean;
}

export function ContributionGraph({
  className = '',
  showHeader = true,
  width = 800,
  height = 200,
  cellSize = 12,
  showTooltip = true,
}: ContributionGraphProps) {
  // Mobile-responsive dimensions
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const responsiveWidth = isMobile ? Math.min(350, window.innerWidth - 32) : width;
  const responsiveHeight = isMobile ? Math.min(160, height) : height;
  const responsiveCellSize = isMobile ? Math.min(8, cellSize) : cellSize;
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { data: contributions, isLoading, isError, error } = useGitHubContributions();

  // Process contribution data for D3 visualization
  const processedData = useMemo(() => {
    if (!contributions) return [];

    // Group contributions by week
    const weeks: Array<{
      week: Date;
      days: Array<{
        date: Date;
        value: number;
        color: string;
      }>;
    }> = [];

    // Get the date range (past year)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

    // Generate all weeks in the range
    let currentWeek = startOfWeek(startDate, { weekStartsOn: 0 }); // Sunday start
    const finalWeek = endOfWeek(endDate, { weekStartsOn: 0 });

    while (currentWeek <= finalWeek) {
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
      const daysInWeek = eachDayOfInterval({ start: currentWeek, end: weekEnd });
      
      const weekData = {
        week: new Date(currentWeek),
        days: daysInWeek.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const contribution = contributions.find(c => c.date === dateStr);
          return {
            date: day,
            value: contribution?.contributionCount || 0,
            color: contribution?.color || '#ebedf0',
          };
        }),
      };

      weeks.push(weekData);
      currentWeek = new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000); // Next week
    }

    return weeks;
  }, [contributions]);

  useEffect(() => {
    if (!svgRef.current || !processedData.length || isLoading) return;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
    
    // Clear previous content
    svg.selectAll('*').remove();

    // Set up responsive dimensions
    const margin = isMobile 
      ? { top: 15, right: 10, bottom: 25, left: 30 }
      : { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = responsiveWidth - margin.left - margin.right;
    const chartHeight = responsiveHeight - margin.top - margin.bottom;

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate responsive cell spacing and size
    const cellSpacing = isMobile ? 1 : 2;
    const actualCellSize = Math.min(responsiveCellSize, (chartWidth - cellSpacing * processedData.length) / processedData.length);

    // Add month labels
    const monthsShown = new Set<string>();
    processedData.forEach((week, weekIndex) => {
      const month = format(week.week, 'MMM');
      const monthKey = format(week.week, 'yyyy-MM');
      
      if (!monthsShown.has(monthKey) && weekIndex % (isMobile ? 6 : 4) === 0) {
        monthsShown.add(monthKey);
        g.append('text')
          .attr('x', weekIndex * (actualCellSize + cellSpacing))
          .attr('y', -5)
          .attr('text-anchor', 'start')
          .attr('font-size', isMobile ? '8px' : '10px')
          .attr('fill', 'currentColor')
          .attr('class', 'text-gray-600 dark:text-gray-400')
          .text(month);
      }
    });

    // Day labels (abbreviated) - Mobile friendly
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    dayLabels.forEach((day, i) => {
      if (i % (isMobile ? 3 : 2) === 1) { // Show fewer labels on mobile
        g.append('text')
          .attr('x', isMobile ? -8 : -10)
          .attr('y', i * (actualCellSize + cellSpacing) + actualCellSize / 2)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', isMobile ? '7px' : '9px')
          .attr('fill', 'currentColor')
          .attr('class', 'text-gray-500 dark:text-gray-500')
          .text(day);
      }
    });

    // Create week groups
    const weekGroups = g.selectAll('.week')
      .data(processedData)
      .enter()
      .append('g')
      .attr('class', 'week')
      .attr('transform', (_d, i) => `translate(${i * (actualCellSize + cellSpacing)}, 0)`);

    // Create day rectangles
    weekGroups.selectAll('.day')
      .data(d => d.days)
      .enter()
      .append('rect')
      .attr('class', 'day')
      .attr('x', 0)
      .attr('y', (_d, i) => i * (actualCellSize + cellSpacing))
      .attr('width', actualCellSize)
      .attr('height', actualCellSize)
      .attr('rx', 2)
      .attr('fill', d => d.color)
      .attr('stroke', 'rgba(255,255,255,0.1)')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        if (!showTooltip) return;
        
        // Highlight the cell
        d3.select(this)
          .attr('stroke', '#1f2937')
          .attr('stroke-width', 1);

        // Show tooltip
        const contributionText = d.value === 0 ? 'No contributions' : 
                                d.value === 1 ? '1 contribution' : 
                                `${d.value} contributions`;

        tooltip
          .style('opacity', 1)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .html(`
            <div class="bg-gray-900 text-white text-xs rounded py-1 px-2 shadow-lg">
              <div class="font-medium">${contributionText}</div>
              <div class="text-gray-300">${format(d.date, 'MMM d, yyyy')}</div>
            </div>
          `);
      })
      .on('mouseleave', function(_event, _d) {
        if (!showTooltip) return;
        
        // Remove highlight
        d3.select(this)
          .attr('stroke', 'rgba(255,255,255,0.1)')
          .attr('stroke-width', 0.5);

        // Hide tooltip
        tooltip.style('opacity', 0);
      });

    // Add legend
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${chartWidth - 150}, ${chartHeight + 15})`);

    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-size', '10px')
      .attr('fill', 'currentColor')
      .attr('class', 'text-gray-600 dark:text-gray-400')
      .text('Less');

    const legendColors = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196027'];
    legendColors.forEach((color, i) => {
      legend.append('rect')
        .attr('x', 25 + i * 12)
        .attr('y', -8)
        .attr('width', 10)
        .attr('height', 10)
        .attr('rx', 1)
        .attr('fill', color);
    });

    legend.append('text')
      .attr('x', 85)
      .attr('y', 0)
      .attr('font-size', '10px')
      .attr('fill', 'currentColor')
      .attr('class', 'text-gray-600 dark:text-gray-400')
      .text('More');

  }, [processedData, responsiveWidth, responsiveHeight, responsiveCellSize, showTooltip, isLoading, isMobile]);

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Contribution Graph
            </h3>
          </div>
        )}
        <div className="p-6 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mx-auto" />
            <div className="grid grid-cols-52 gap-1">
              {Array.from({ length: 364 }).map((_, i) => (
                <div key={i} className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Contribution Graph
            </h3>
          </div>
        )}
        <div className="p-6 text-center">
          <div className="text-red-600 dark:text-red-400">
            <div className="text-lg font-medium mb-2">Failed to load contributions</div>
            <div className="text-sm opacity-75">
              {error?.message || 'Unable to fetch GitHub contribution data'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalContributions = contributions?.reduce((sum, day) => sum + day.contributionCount, 0) || 0;
  const activeDays = contributions?.filter(day => day.contributionCount > 0).length || 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {showHeader && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
            Contribution Graph
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalContributions.toLocaleString()} contributions in the last year 
            {activeDays > 0 && (
              <span className="hidden sm:inline">
                {` • ${activeDays} active days`}
              </span>
            )}
          </p>
          {/* Mobile: Show active days on separate line */}
          {activeDays > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
              {activeDays} active days
            </p>
          )}
        </div>
      )}
      
      <div className="p-3 sm:p-6 overflow-x-auto">
        <div className="relative">
          <svg
            ref={svgRef}
            width={responsiveWidth}
            height={responsiveHeight}
            className="text-gray-600 dark:text-gray-400 mx-auto block"
            style={{ minWidth: responsiveWidth }}
          />
          {showTooltip && (
            <div
              ref={tooltipRef}
              className="absolute pointer-events-none opacity-0 transition-opacity z-10"
              style={{ position: 'fixed' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}