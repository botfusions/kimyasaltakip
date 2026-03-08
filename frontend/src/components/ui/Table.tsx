import React, { type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={cn("bg-gray-50 dark:bg-gray-900", className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody
      className={cn("divide-y divide-gray-200 dark:divide-gray-700", className)}
    >
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr
      className={cn(
        "transition-colors",
        onClick && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <th
      className={cn(
        "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}
