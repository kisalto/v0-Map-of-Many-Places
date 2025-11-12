import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react"
import { Badge } from "@/components/ui/badge"
import { User, Users, MapPin, Map } from "lucide-react"

interface MentionOptions {
  HTMLAttributes: Record<string, string>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mention: {
      setMention: (attributes: {
        id: string
        label: string
        type: "character" | "region" | "subregion"
        color?: string
        characterType?: "player" | "ally" | "enemy" | "neutral"
      }) => ReturnType
    }
  }
}

const MentionComponent = ({
  node,
}: { node: { attrs: { id: string; label: string; type: string; color?: string; characterType?: string } } }) => {
  const { label, type, color, characterType } = node.attrs

  const getIcon = () => {
    if (type === "character") {
      return characterType === "player" ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />
    }
    if (type === "region") return <Map className="h-3 w-3" />
    if (type === "subregion") return <MapPin className="h-3 w-3" />
    return null
  }

  const getColor = () => {
    if (color) return color
    if (type === "character") {
      switch (characterType) {
        case "player":
          return "#10b981" // green
        case "ally":
          return "#3b82f6" // blue
        case "enemy":
          return "#ef4444" // red
        case "neutral":
          return "#6b7280" // gray
        default:
          return "#10b981"
      }
    }
    if (type === "region") return "#a855f7" // purple
    if (type === "subregion") return "#ec4899" // pink
    return "#3b82f6"
  }

  return (
    <NodeViewWrapper className="inline-block" contentEditable={false}>
      <Badge
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
        style={{
          backgroundColor: getColor(),
          color: "#ffffff",
          border: "none",
        }}
      >
        {getIcon()}
        {label}
      </Badge>
    </NodeViewWrapper>
  )
}

export const Mention = Node.create<MentionOptions>({
  name: "mention",

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: "inline",

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {}
          }
          return {
            "data-id": attributes.id,
          }
        },
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {}
          }
          return {
            "data-label": attributes.label,
          }
        },
      },
      type: {
        default: "character",
        parseHTML: (element) => element.getAttribute("data-type"),
        renderHTML: (attributes) => {
          if (!attributes.type) {
            return {}
          }
          return {
            "data-type": attributes.type,
          }
        },
      },
      color: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-color"),
        renderHTML: (attributes) => {
          if (!attributes.color) {
            return {}
          }
          return {
            "data-color": attributes.color,
          }
        },
      },
      characterType: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-character-type"),
        renderHTML: (attributes) => {
          if (!attributes.characterType) {
            return {}
          }
          return {
            "data-character-type": attributes.characterType,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="mention"]`,
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes({ "data-type": "mention" }, this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  renderText({ node }) {
    return `@${node.attrs.label}`
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionComponent)
  },

  addCommands() {
    return {
      setMention:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          })
        },
    }
  },
})
