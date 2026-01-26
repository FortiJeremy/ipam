import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';

export function StatsCard({ title, value, icon: Icon, description, className, href }) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        {Icon && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors duration-200">
            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </div>
      {description && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-green-600 dark:text-green-400">{description}</span>
        </p>
      )}
    </>
  );

  const cardClasses = twMerge(
    'bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 block transition-all hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/50 duration-200',
    className
  );

  if (href) {
    return (
      <Link to={href} className={cardClasses}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClasses}>
      {content}
    </div>
  );
}
