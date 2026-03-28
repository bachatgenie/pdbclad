import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TodoItem } from "@/components/todo-item";
import { AddTodoForm } from "@/components/add-todo-form";
import { LifeProgressButton } from "@/components/life-progress-button";

export default async function TodosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [activeTodos, lifetimeTodos, completedCount] = await Promise.all([
    prisma.todo.findMany({
      where: { userId: session.user.id, isLifetime: false, completedAt: null },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    }),
    prisma.todo.findMany({
      where: { userId: session.user.id, isLifetime: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.todo.count({
      where: { userId: session.user.id, completedAt: { not: null } },
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Todos & Life List</h1>
        <span className="text-sm text-text-muted">{completedCount} completed all time</span>
      </div>

      {/* Add todo */}
      <AddTodoForm />

      {/* Active todos */}
      <section className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">ACTIVE</h2>
        <div className="space-y-1">
          {activeTodos.length === 0 ? (
            <p className="text-text-muted text-sm py-4 text-center">All clear! Add a task above.</p>
          ) : (
            activeTodos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
          )}
        </div>
      </section>

      {/* Life List */}
      <section className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">
          ⭐ LIFE LIST
        </h2>
        <div className="space-y-1">
          {lifetimeTodos.length === 0 ? (
            <p className="text-text-muted text-sm py-4 text-center">
              Add your lifetime goals here — bucket list items that never expire.
            </p>
          ) : (
            lifetimeTodos.map((todo) => (
              <div key={todo.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <TodoItem todo={todo} />
                </div>
                {todo.progressMax && (
                  <LifeProgressButton
                    todoId={todo.id}
                    progress={todo.progress ?? 0}
                    progressMax={todo.progressMax}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
