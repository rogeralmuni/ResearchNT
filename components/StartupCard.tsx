import { Card, CardContent } from './ui/Card';
import Badge from './ui/Badge';

interface StartupCardProps {
  name: string;
  sector: string;
  stage: string;
  country: string;
}

const getStageVariant = (stage: string) => {
  const lowerStage = stage.toLowerCase();
  if (lowerStage.includes('seed')) return 'warning';
  if (lowerStage.includes('series a')) return 'primary';
  if (lowerStage.includes('series b') || lowerStage.includes('series c')) return 'success';
  if (lowerStage.includes('pre-seed')) return 'gray';
  return 'secondary';
};

export default function StartupCard({ name, sector, stage, country }: StartupCardProps) {
  return (
    <Card hover className="animate-fade-in">
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{name}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getStageVariant(stage)}>{stage}</Badge>
              <Badge variant="gray">{sector}</Badge>
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {country}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 