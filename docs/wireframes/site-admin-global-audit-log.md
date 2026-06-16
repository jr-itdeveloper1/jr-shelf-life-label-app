# Global Audit Log

![Global Audit Log](assets/site-admin-global-audit-log.svg)

## Purpose / 页面目的

Read-only platform audit trail across companies. / 跨公司只读审计记录。

## Roles Allowed / 可访问角色

- Site Admin

## Main Actions / 主要操作

- Filter by company
- Filter by actor/action/date
- Export audit CSV
- Open related record

## Data Shown / 显示数据

- Timestamp
- Company
- Actor
- Action
- Record type
- IP address

## Empty/Error/Loading States / 空状态、错误、加载状态

- No matching events
- Export running
- Retention limit reached
- Record deleted

## Permissions / 权限规则

- Audit log is append-only.
- Site Admin can view all tenant events.
- Sensitive fields should be masked.
