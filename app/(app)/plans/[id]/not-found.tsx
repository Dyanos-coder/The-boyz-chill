import Link from "next/link";

export default function PlanNotFound() {
  return (
    <div className="empty">
      <h1 className="empty__title">Ce plan n&apos;existe plus</h1>
      <p className="empty__text">Il a peut-être été supprimé par celui qui l&apos;a lancé.</p>
      <Link className="btn btn--primary" href="/">
        Retour aux plans
      </Link>
    </div>
  );
}
