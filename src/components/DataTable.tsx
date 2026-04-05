import { Fragment } from "react";
import type { ReactNode } from "react";

// ─── Types ──────────────────────────────────────────────────

interface Column {
  label: string;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column[];
  data: T[];
  loading: boolean;
  emptyIcon: string;
  emptyMessage: string;
  rowKey: (item: T) => string;
  renderRow: (item: T) => ReactNode;
}

// ─── Cell sub-components ────────────────────────────────────

interface CellProps {
  children?: ReactNode;
  className?: string;
}

function Cell({ children, className }: CellProps) {
  return <td className={className}>{children}</td>;
}

function BoldCell({ children }: CellProps) {
  return <td className="td-bold">{children}</td>;
}

function MonoCell({ children }: CellProps) {
  return <td className="td-mono">{children}</td>;
}

function DimCell({ children }: CellProps) {
  return <td className="td-mono td-dim">{children}</td>;
}

function NumericCell({ children }: CellProps) {
  return <td className="col-num">{children}</td>;
}

function ActionsCell({ children }: CellProps) {
  return (
    <td className="td-actions">
      <div className="row-actions">{children}</div>
    </td>
  );
}

interface UserCellProps {
  name: string;
  avatarColor?: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
}

function UserCell({
  name,
  avatarColor,
  avatarUrl,
  size = "sm",
}: UserCellProps) {
  const initials = name.slice(0, 2).toUpperCase();
  const color = avatarColor || "var(--accent)";

  let avatarContent: ReactNode = initials;
  if (avatarUrl) {
    avatarContent = <img src={avatarUrl} alt="" />;
  }

  return (
    <td>
      <div className="user-cell">
        <div
          className={`nav-avatar avatar-${size}`}
          style={{ borderColor: color, background: color }}
        >
          {avatarContent}
        </div>
        <span className="td-bold">{name}</span>
      </div>
    </td>
  );
}

// ─── DataTable ──────────────────────────────────────────────

function DataTable<T>({
  columns,
  data,
  loading,
  emptyIcon,
  emptyMessage,
  rowKey,
  renderRow,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner spinner-lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">{emptyIcon}</div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.label || "actions"} className={col.className}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <Fragment key={rowKey(item)}>{renderRow(item)}</Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Namespace exports ──────────────────────────────────────

const Table = Object.assign(DataTable, {
  Cell,
  BoldCell,
  MonoCell,
  DimCell,
  NumericCell,
  ActionsCell,
  UserCell,
});

export default Table;
