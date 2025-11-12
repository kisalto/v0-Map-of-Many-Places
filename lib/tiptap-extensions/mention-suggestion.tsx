import { ReactRenderer } from "@tiptap/react"
import tippy, { type Instance as TippyInstance } from "tippy.js"
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion"
import { MentionList } from "@/components/mention-list"

export const getMentionSuggestion = (
  adventureId: string,
  onFetchSuggestions: (
    query: string,
    type: "character" | "region",
  ) => Promise<
    Array<{
      id: string
      name: string
      type: "character" | "region" | "subregion"
      color?: string
      characterType?: "player" | "ally" | "enemy" | "neutral"
    }>
  >,
): Omit<SuggestionOptions, "editor"> => {
  return {
    char: "@",
    allowSpaces: true,

    items: async ({ query }: { query: string }) => {
      const suggestions = await onFetchSuggestions(query, "character")
      return suggestions
    },

    render: () => {
      let component: ReactRenderer<unknown>
      let popup: TippyInstance[]

      return {
        onStart: (props: SuggestionProps) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          })

          if (!props.clientRect) {
            return
          }

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          })
        },

        onUpdate(props: SuggestionProps) {
          component.updateProps(props)

          if (!props.clientRect) {
            return
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          })
        },

        onKeyDown(props: { event: KeyboardEvent }) {
          if (props.event.key === "Escape") {
            popup[0].hide()
            return true
          }

          return (
            (component.ref as { onKeyDown?: (props: { event: KeyboardEvent }) => boolean })?.onKeyDown?.(props) ?? false
          )
        },

        onExit() {
          popup[0].destroy()
          component.destroy()
        },
      }
    },
  }
}

export const getRegionSuggestion = (
  adventureId: string,
  onFetchSuggestions: (
    query: string,
    type: "character" | "region",
  ) => Promise<
    Array<{
      id: string
      name: string
      type: "character" | "region" | "subregion"
      color?: string
    }>
  >,
): Omit<SuggestionOptions, "editor"> => {
  return {
    char: "#",
    allowSpaces: true,

    items: async ({ query }: { query: string }) => {
      const suggestions = await onFetchSuggestions(query, "region")
      return suggestions
    },

    render: () => {
      let component: ReactRenderer<unknown>
      let popup: TippyInstance[]

      return {
        onStart: (props: SuggestionProps) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          })

          if (!props.clientRect) {
            return
          }

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          })
        },

        onUpdate(props: SuggestionProps) {
          component.updateProps(props)

          if (!props.clientRect) {
            return
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          })
        },

        onKeyDown(props: { event: KeyboardEvent }) {
          if (props.event.key === "Escape") {
            popup[0].hide()
            return true
          }

          return (
            (component.ref as { onKeyDown?: (props: { event: KeyboardEvent }) => boolean })?.onKeyDown?.(props) ?? false
          )
        },

        onExit() {
          popup[0].destroy()
          component.destroy()
        },
      }
    },
  }
}
