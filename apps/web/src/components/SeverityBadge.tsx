export function SeverityBadge({ severity }: { severity: string }) {
  const colors = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    error: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  const colorClass = colors[severity as keyof typeof colors] || colors.info;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {severity}
    </span>
  );
}