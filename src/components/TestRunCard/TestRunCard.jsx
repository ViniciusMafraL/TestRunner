import { AvatarWithLabel } from '../Avatar/Avatar.jsx';
import { testRunStatusCategory } from '../../utils/statusCategory.js';

export function TestRunCard({ demand, canWrite = true }) {
  return (
    <div
      className="card test-run-card"
      data-testid="test-run-card"
      draggable={canWrite}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', demand.id);
      }}
    >
      <span
        className={`test-run-card-status status-dot status-dot--${testRunStatusCategory(demand.status)}`}
        title={demand.status}
        aria-hidden="true"
      />
      <div className="test-run-card-title table-cell-ellipsis">{demand.build}</div>
      <div className="test-run-card-row">
        <span className="table-cell-ellipsis">{demand.testType}</span>
        <span className="table-cell-ellipsis">Version {demand.version}</span>
      </div>
      <div className="test-run-card-row">
        <span className="table-cell-ellipsis">{demand.platform}</span>
        <AvatarWithLabel name={demand.responsible} />
      </div>
    </div>
  );
}
