interface ProjectDetailPageProps {
  params: { id: string };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  return (
    <div>
      <h2>Project {params.id}</h2>
      <p>Project detail placeholder.</p>
    </div>
  );
}
