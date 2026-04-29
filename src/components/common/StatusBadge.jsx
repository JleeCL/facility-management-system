const STATUS_CONFIG = {
  pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'In Progress', classes: 'bg-blue-100 text-blue-800' },
  resolved: { label: 'Resolved', classes: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', classes: 'bg-gray-100 text-gray-700' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, classes: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
}
