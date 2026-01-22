import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';

export function StatsCard({ title, value, icon: Icon, description, className, href }) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {Icon && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        )}
      </div>
      {description && (
        <p className="mt-4 text-sm text-gray-600">
          <span className="font-medium text-green-600">{description}</span>
        </p>
      )}
    </>
  );

  const cardClasses = twMerge(
    'bg-white p-6 rounded-xl shadow-sm border border-gray-100 block transition-all hover:shadow-md hover:border-blue-100',
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
