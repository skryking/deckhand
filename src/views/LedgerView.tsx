import { useState, useMemo } from 'react'
import { Wallet, Plus } from 'lucide-react'
import { Button, SearchInput, StatCard, Modal, ModalFooter } from '../components/ui'
import { TransactionModal, TransactionCard, LedgerFilters } from '../components/ledger'
import { useTransactions, useBalance, useShips, useLocations } from '../lib/db'
import { transactionsApi } from '../lib/db/api'
import { useRefresh } from '../stores'
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
} from '../types/database'

export function LedgerView() {
  // Data hooks
  const { data: transactions, loading, refetch } = useTransactions()
  const { data: balance, refetch: refetchBalance } = useBalance()
  const { data: ships } = useShips()
  const { data: locations } = useLocations()
  const invalidateBalance = useRefresh((s) => s.invalidateBalance)

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showType, setShowType] = useState<'all' | 'income' | 'expenses'>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null)

  // Name lookup maps
  const shipNames = useMemo(() => {
    const map: Record<string, string> = {}
    ships?.forEach((ship) => {
      map[ship.id] = ship.nickname || `${ship.manufacturer} ${ship.model}`
    })
    return map
  }, [ships])

  const locationNames = useMemo(() => {
    const map: Record<string, string> = {}
    locations?.forEach((loc) => {
      map[loc.id] = loc.name
    })
    return map
  }, [locations])

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return []

    let result = transactions

    // Type filter
    if (showType === 'income') {
      result = result.filter((t) => t.amount > 0)
    } else if (showType === 'expenses') {
      result = result.filter((t) => t.amount < 0)
    }

    // Category filter
    if (activeCategory) {
      result = result.filter((t) => t.category === activeCategory)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.description?.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      )
    }

    return result
  }, [transactions, showType, activeCategory, searchQuery])

  // Statistics
  const stats = useMemo(() => {
    if (!transactions) return { income: 0, expenses: 0, count: 0 }

    let income = 0
    let expenses = 0

    transactions.forEach((t) => {
      if (t.amount > 0) income += t.amount
      else expenses += Math.abs(t.amount)
    })

    return { income, expenses, count: transactions.length }
  }, [transactions])

  // Filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      total: transactions?.length ?? 0,
      income: 0,
      expenses: 0,
    }

    transactions?.forEach((t) => {
      if (t.amount > 0) counts.income++
      else counts.expenses++
      counts[t.category] = (counts[t.category] || 0) + 1
    })

    return counts
  }, [transactions])

  const handleSave = async (data: CreateTransactionInput | UpdateTransactionInput) => {
    if (editingTransaction) {
      await transactionsApi.update(editingTransaction.id, data)
    } else {
      await transactionsApi.create(data as CreateTransactionInput)
    }
    refetch()
    refetchBalance()
    invalidateBalance()
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingTransaction(null)
    setIsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await transactionsApi.delete(deleteConfirm.id)
      setDeleteConfirm(null)
      refetch()
      refetchBalance()
      invalidateBalance()
    }
  }

  const formatBalance = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0'
    return value.toLocaleString()
  }

  const transactionCount = transactions?.length ?? 0

  return (
    <>
      <header className="py-5 px-7 border-b border-subtle flex justify-between items-center bg-hull">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-semibold tracking-display text-text-primary">
            Ledger
          </h1>
          <span
            className={`font-mono text-[11px] py-1 px-2.5 rounded-sm ${
              (balance ?? 0) >= 0
                ? 'bg-success/20 text-success'
                : 'bg-danger/20 text-danger'
            }`}
          >
            {formatBalance(balance)} aUEC
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <SearchInput
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-1" />
            Add Transaction
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto scrollbar-deckhand">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          <StatCard
            label="Current Balance"
            value={formatBalance(balance)}
            unit="aUEC"
            variant="amber"
          />
          <StatCard
            label="Total Income"
            value={stats.income.toLocaleString()}
            unit="aUEC"
          />
          <StatCard
            label="Total Expenses"
            value={stats.expenses.toLocaleString()}
            unit="aUEC"
          />
          <StatCard label="Transactions" value={stats.count} />
        </div>

        {/* Filters bar */}
        {transactionCount > 0 && (
          <div className="mb-6">
            <LedgerFilters
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              showType={showType}
              onTypeChange={setShowType}
              counts={filterCounts}
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-text-muted">Loading...</div>
          </div>
        ) : transactionCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-panel border border-subtle flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="font-display text-lg font-medium text-text-primary mb-2">
              No Transactions Yet
            </h2>
            <p className="text-text-muted text-sm max-w-md mb-6">
              Track your income and expenses across the verse. Log trading profits,
              bounty payouts, ship purchases, and more.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-1" />
              Add First Transaction
            </Button>
          </div>
        ) : (
          <div className="max-w-4xl">
            {filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                shipName={transaction.shipId ? shipNames[transaction.shipId] : undefined}
                locationName={
                  transaction.locationId ? locationNames[transaction.locationId] : undefined
                }
                onClick={() => handleEdit(transaction)}
              />
            ))}

            {filteredTransactions.length === 0 && (searchQuery || activeCategory || showType !== 'all') && (
              <div className="text-center py-12 text-text-muted">
                No transactions match your{' '}
                {searchQuery && (activeCategory || showType !== 'all')
                  ? 'search and filters'
                  : searchQuery
                  ? 'search'
                  : 'filters'}
              </div>
            )}
          </div>
        )}
      </main>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTransaction(null)
        }}
        onSave={handleSave}
        onDelete={editingTransaction ? () => {
          setIsModalOpen(false)
          setDeleteConfirm(editingTransaction)
          setEditingTransaction(null)
        } : undefined}
        transaction={editingTransaction}
        ships={ships || []}
        locations={locations || []}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Transaction?"
        size="sm"
      >
        <p className="text-text-secondary mb-2">
          Are you sure you want to delete this transaction? This action cannot be
          undone.
        </p>
        <ModalFooter className="-mx-6 -mb-5 mt-5">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            className="bg-danger hover:bg-danger/80"
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
