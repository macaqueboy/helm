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
      name: "execute_code",
      description: "Ejecuta un script de código (JavaScript/Node.js) en un entorno de sandbox seguro y devuelve el resultado / salida de consola. Úsalo para probar algoritmos, resolver cálculos, procesar datos o construir lógica.",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "Código JavaScript/Node.js a ejecutar en el sandbox",
          },
        },
        required: ["code"],
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
            description: "Nombre del agente a mencionar (ej: coder, scout, reviewer, helm)",
          },
          message: {
            type: "string",
            description: "Mensaje o instrucción para el otro agente",
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
  {
    type: "function",
    function: {
      name: "save_memory",
      description: "Guarda una nota, hecho o lección aprendida en la memoria persistente del agente.",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "Contenido de la nota o hecho a recordar",
          },
          category: {
            type: "string",
            description: "Categoría opcional (ej: general, preferencia, leccion)",
          },
          key: {
            type: "string",
            description: "Clave opcional para identificar la memoria",
          },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recall_memory",
      description: "Consulta las memorias guardadas del agente.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Filtrar por categoría (opcional)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_reaction",
      description: "Añade una reacción de emoji a un mensaje reciente.",
      parameters: {
        type: "object",
        properties: {
          message_id: {
            type: "string",
            description: "ID del mensaje al que reaccionar",
          },
          emoji: {
            type: "string",
            description: "Emoji para la reacción (ej: 👍, 🚀, 💡, 🔥, ✅)",
          },
        },
        required: ["message_id", "emoji"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_reminder",
      description: "Programa un recordatorio para el agente o canal.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Título o descripción del recordatorio",
          },
          minutes_from_now: {
            type: "number",
            description: "Minutos a esperar antes de disparar el recordatorio",
          },
        },
        required: ["title", "minutes_from_now"],
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
  | "execute_code"
  | "mention_agent"
  | "list_agents"
  | "save_memory"
  | "recall_memory"
  | "add_reaction"
  | "set_reminder";
