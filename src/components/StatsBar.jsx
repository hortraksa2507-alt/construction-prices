import { useFilteredProducts } from "../hooks/useFilteredProducts";
import "../styles/Stats.css";

export default function StatsBar() {
  const { stats } = useFilteredProducts();

  return (
    <div className="stats-bar">
      <div className="stat-card">
        <div className="stat-number">{stats.total}</div>
        <div className="stat-label">ទំនិញសរុប</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.withPrice}</div>
        <div className="stat-label">មានតម្លៃ</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.withoutPrice}</div>
        <div className="stat-label">គ្មានតម្លៃ</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.withImage}</div>
        <div className="stat-label">មានរូបភាព</div>
      </div>
    </div>
  );
}
