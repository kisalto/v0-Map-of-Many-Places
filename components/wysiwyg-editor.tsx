"use client"

import { useEffect, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { Mention } from "@/lib/tiptap-extensions/mention"
import Suggestion from "@tiptap/suggestion"
import { getMentionSuggestion, getRegionSuggestion } from "@/lib/tiptap-extensions/mention-suggestion"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import {
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface WysiwygEditorProps {
  value: string
  onChange: (value: string) => void
  adventureId: string
  disabled?: boolean
  placeholder?: string
}

export function WysiwygEditor({
  value,
  onChange,
  adventureId,
  disabled = false,
  placeholder = "Comece a escrever... Use @ para mencionar personagens e # para regiões",
}: WysiwygEditorProps) {
  const supabase = createClient()

  const fetchSuggestions = useCallback(
    async (query: string, type: "character" | "region") => {
      if (type === "character") {
        const { data: characters } = await supabase
          .from("characters")
          .select("id, name, character_type, tag_color, tag_label")
          .eq("adventure_id", adventureId)
          .ilike("name", `%${query}%`)
          .limit(10)

        return (
          characters?.map((char) => ({
            id: char.id,
            name: char.tag_label || char.name,
            type: "character" as const,
            color: char.tag_color,
            characterType: char.character_type as "player" | "ally" | "enemy" | "neutral",
          })) || []
        )
      } else {
        const [{ data: regions }, { data: subregions }] = await Promise.all([
          supabase
            .from("regions")
            .select("id, name, tag_color, tag_label")
            .eq("adventure_id", adventureId)
            .ilike("name", `%${query}%`)
            .limit(5),
          supabase.from("subregions").select("id, name, tag_color, tag_label").ilike("name", `%${query}%`).limit(5),
        ])

        return [
          ...(regions?.map((region) => ({
            id: region.id,
            name: region.tag_label || region.name,
            type: "region" as const,
            color: region.tag_color,
          })) || []),
          ...(subregions?.map((subregion) => ({
            id: subregion.id,
            name: subregion.tag_label || subregion.name,
            type: "subregion" as const,
            color: subregion.tag_color,
          })) || []),
        ]
      }
    },
    [adventureId, supabase],
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
      }).extend({
        addProseMirrorPlugins() {
          return [
            Suggestion({
              editor: this.editor,
              ...getMentionSuggestion(adventureId, fetchSuggestions),
            }),
          ]
        },
      }),
      Mention.extend({ name: "regionMention" })
        .configure({
          HTMLAttributes: {
            class: "mention region-mention",
          },
        })
        .extend({
          addProseMirrorPlugins() {
            return [
              Suggestion({
                editor: this.editor,
                ...getRegionSuggestion(adventureId, fetchSuggestions),
              }),
            ]
          },
        }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none min-h-[500px] p-4 bg-background border-2 border-primary/30 rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
          "text-foreground leading-relaxed overflow-y-auto",
          disabled && "opacity-50 cursor-not-allowed",
        ),
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-secondary border border-primary/30 rounded-lg">
        {/* Headings */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary",
            editor.isActive("heading", { level: 1 }) && "bg-primary/20 text-primary",
          )}
          title="Título 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary",
            editor.isActive("heading", { level: 2 }) && "bg-primary/20 text-primary",
          )}
          title="Título 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary",
            editor.isActive("heading", { level: 3 }) && "bg-primary/20 text-primary",
          )}
          title="Título 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1 bg-primary/30" />

        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary",
            editor.isActive("bold") && "bg-primary/20 text-primary",
          )}
          title="Negrito (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary",
            editor.isActive("italic") && "bg-primary/20 text-primary",
          )}
          title="Itálico (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary",
            editor.isActive("underline") && "bg-primary/20 text-primary",
          )}
          title="Sublinhado (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1 bg-primary/30" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary",
            editor.isActive("bulletList") && "bg-primary/20 text-primary",
          )}
          title="Lista com marcadores"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary",
            editor.isActive("orderedList") && "bg-primary/20 text-primary",
          )}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1 bg-primary/30" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary",
            editor.isActive({ textAlign: "left" }) && "bg-primary/20 text-primary",
          )}
          title="Alinhar à esquerda"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary",
            editor.isActive({ textAlign: "center" }) && "bg-primary/20 text-primary",
          )}
          title="Centralizar"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary",
            editor.isActive({ textAlign: "right" }) && "bg-primary/20 text-primary",
          )}
          title="Alinhar à direita"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      <p className="text-sm text-muted-foreground">
        <span className="text-primary font-medium">Dica:</span> Use @ para mencionar personagens e # para mencionar
        regiões. As menções aparecerão como badges coloridos no texto.
      </p>
    </div>
  )
}
