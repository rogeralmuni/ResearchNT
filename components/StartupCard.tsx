interface StartupCardProps {
  name: string;
  sector: string;
  stage: string;
  country: string;
}

export default function StartupCard({ name, sector, stage, country }: StartupCardProps) {
  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'seed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'series a':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'series b':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'series c':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="group relative bg-white rounded-xl shadow-sm border border-gray-200/50 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/50 transition-all duration-300"></div>
      
      <div className="relative p-6">
        {/* Header with icon and name */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                {name}
              </h3>
              <p className="text-sm text-gray-500">{sector}</p>
            </div>
          </div>
          
          {/* Stage badge */}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStageColor(stage)}`}>
            {stage}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{country}</span>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        </div>
      </div>
    </div>
  );
} 