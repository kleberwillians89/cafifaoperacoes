export const assistantEntityRoute = (type: string, id: string) =>
  type === 'task' ? `/app/tarefas/${id}`
    : type === 'area' ? `/app/areas/${id}`
      : type === 'milestone' ? `/app/marcos/${id}`
        : type === 'risk' ? `/app/riscos/${id}`
          : '/app/arquivos'
