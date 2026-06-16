# System Health / Backups

![System Health / Backups](assets/site-admin-system-health-backups.svg)

## Purpose / 页面目的

Check service health, database backups, and restore readiness. / 查看服务健康度、数据库备份和恢复准备。

## Roles Allowed / 可访问角色

- Site Admin

## Main Actions / 主要操作

- View service status
- Download backup
- Trigger manual backup
- Review restore instructions

## Data Shown / 显示数据

- API health
- Database size
- Latest backup
- Backup retention
- Disk usage

## Empty/Error/Loading States / 空状态、错误、加载状态

- Backup failed
- Disk almost full
- Postgres healthy
- Restore drill overdue

## Permissions / 权限规则

- Backup download should be restricted.
- Restore is performed by server operator.
- Manual backup action is audited.
