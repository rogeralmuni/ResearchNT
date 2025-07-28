interface StartupCardProps {
  name: string;
  sector: string;
  stage: string;
  country: string;
}

export default function StartupCard({ name, sector, stage, country }: StartupCardProps) {
  return (
    <div className="border rounded p-4 bg-white shadow mb-2">
      <h2 className="text-xl font-semibold">{name}</h2>
      <p>Sector: {sector}</p>
      <p>Stage: {stage}</p>
      <p>Country: {country}</p>
    </div>
  );
} 