import FirstStepApp from "@/components/FirstStepApp";

const staticPaths = [
  [], ["start"], ["book"], ["resources"],
  ["resources", "victoria-homelessness-support"], ["resources", "kids-helpline"], ["resources", "1800respect"], ["resources", "lifeline"], ["resources", "tafe-and-vce-vm-options"], ["resources", "paid-work-readiness"], ["resources", "food-and-transport-options"], ["resources", "money-next-steps"],
  ["pathways", "safe-tonight"], ["pathways", "talk"], ["pathways", "work"], ["pathways", "study"], ["pathways", "money"], ["pathways", "food-transport"],
  ["about"], ["faq"], ["privacy"], ["consent"], ["terms"], ["safety"], ["partners"], ["impact"], ["impact-dashboard"], ["merch"], ["demo"], ["committee"],
  ["account"], ["account", "appointments"], ["account", "pathways"], ["account", "referrals"],
  ["worker"], ["worker", "appointments"], ["worker", "availability"], ["worker", "referrals"],
  ["admin"], ["admin", "workers"], ["admin", "resources"], ["admin", "partners"], ["admin", "locations"], ["admin", "service-settings"], ["admin", "impact"],
];

export function generateStaticParams() {
  return staticPaths.map((path) => ({ path }));
}

export default async function CatchAllPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  return <FirstStepApp initialPathname={`/${path.join("/")}`} />;
}
