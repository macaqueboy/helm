// Tool definitions for Helm AI agents
// These are OpenAI-compatible function tool specs sent to the LLM

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Crea una nueva tarea en el canal actual. Úsalo cuando alguien pide hacer algo o cuando detectas una acción pendiente.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Título corto de la tarea, máximo 80 caracteres",
          },
          description: {
            type: "string",
            description: "Descripción detallada de la tarea (opcional)",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "Lista las tareas del canal actual con su estado (todo, in_progress, done). Úsalo cuando alguien pregunta qué hay que hacer o el estado del trabajo.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["todo", "in_progress", "done"],
            description: "Filtrar por estado (opcional). Sin filtro = todas.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Actualiza el estado de una tarea existente.",
      parameters: {
        type: "object",
        properties: {
          number: {
            type: "number",
            description: "Número de la tarea a actualizar",
          },
          status: {
            type: "string",
            enum: ["todo", "in_progress", "done"],
            description: "Nuevo estado de la tarea",
          },
        },
        required: ["number", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_channel",
      description: "Crea un nuevo canal en el workspace. Úsalo cuando un tema necesita su propio espacio.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Nombre del canal en minúsculas, sin espacios (ej: diseno, backend, marketing)",
          },
          description: {
            type: "string",
            description: "Descripción del propósito del canal (opcional)",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Busca información en internet. Úsalo cuando necesitas datos actualizados, documentación, o información que no tienes en contexto.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Consulta de búsqueda en español o inglés",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mention_agent",
      description: "Menciona a otro agente del workspace para que responda o colabore. El agente mencionado recibirá el contexto y responderá en el canal.",
      parameters: {
        type: "object",
        properties: {
          agent_name: {
            type: "string",
            description: "Nombre del agente a mencionar",
          },
          message: {
            type: "string",
            description: "Mensaje o pregunta para el otro agente",
          },
        },
        required: ["agent_name", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_agents",
      description: "Lista todos los agentes disponibles en el workspace con sus especialidades.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

export type ToolName =
  | "create_task"
  | "list_tasks"
  | "update_task"
  | "create_channel"
  | "search_web"
  | "mention_agent"
  | "list_agents";
