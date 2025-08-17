export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">FApp Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a
          href="/transactions"
          className="border rounded-md p-4 hover:bg-gray-50"
        >
          <h2 className="font-medium mb-1">Transactions →</h2>
          <p className="text-sm text-gray-600">
            Add/View transactions.
          </p>
        </a>

        <a
          href="/accounts"
          className="border rounded-md p-4 hover:bg-gray-50"
        >
          <h2 className="font-medium mb-1">Manage Accounts →</h2>
          <p className="text-sm text-gray-600">
            View and manage your accounts.
          </p>
        </a>

        <a
          href="/categories"
          className="border rounded-md p-4 hover:bg-gray-50"
        >
          <h2 className="font-medium mb-1">Manage Categories →</h2>
          <p className="text-sm text-gray-600">
            Create and organize categories.
          </p>
        </a>
      </div>
    </div>
  );
}