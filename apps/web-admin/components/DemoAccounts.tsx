const demoAccounts = [
  { role: 'Site Admin', email: 'site.admin@jrlabels.example', password: 'ChangeMe123!', access: 'Platform administration' },
  { role: 'Company Admin', email: 'grace@jrfoods.example', password: 'ChangeMe123!', access: 'All company data' },
  { role: 'Outlet User', email: 'cklead@jrfoods.example', password: 'ChangeMe123!', access: 'Central Kitchen, Jurong Outlet' },
  { role: 'Outlet User', email: 'orchard@jrfoods.example', password: 'ChangeMe123!', access: 'Orchard Outlet' },
  { role: 'Outlet User', email: 'tmp@jrfoods.example', password: 'ChangeMe123!', access: 'Tampines Outlet' },
];

export function DemoAccounts() {
  return (
    <section className="demo-accounts">
      <div className="panel-head">
        <h2>Demo accounts</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Email</th>
            <th>Password</th>
            <th>Access</th>
          </tr>
        </thead>
        <tbody>
          {demoAccounts.map((account) => (
            <tr key={account.email}>
              <td>{account.role}</td>
              <td><code>{account.email}</code></td>
              <td><code>{account.password}</code></td>
              <td>{account.access}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
