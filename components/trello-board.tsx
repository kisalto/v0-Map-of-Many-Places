"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Chapter {
  id: string
  title: string
  order_index: number
  is_completed: boolean
}

interface Entry {
  id: string
  title: string
  description: string | null
  chapter_id: string | null
  order_index: number
}

interface TrelloBoardProps {
  adventureId: string
  chapters: Chapter[]
  entries: Entry[]
}

export function TrelloBoard({ adventureId, chapters: initialChapters, entries: initialEntries }: TrelloBoardProps) {
  const [chapters, setChapters] = useState(initialChapters)
  const [entries, setEntries] = useState(initialEntries)
  const [newChapterTitle, setNewChapterTitle] = useState("")
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [editingChapterTitle, setEditingChapterTitle] = useState("")
  const router = useRouter()

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return

    const supabase = createClient()

    const { data, error } = await supabase
      .from("chapters")
      .insert({
        adventure_id: adventureId,
        title: newChapterTitle,
        order_index: chapters.length,
        is_completed: false,
      })
      .select()
      .single()

    if (!error && data) {
      setChapters([...chapters, data])
      setNewChapterTitle("")
      router.refresh()
    }
  }

  const handleEditChapter = async (chapterId: string) => {
    if (!editingChapterTitle.trim()) return

    const supabase = createClient()

    await supabase.from("chapters").update({ title: editingChapterTitle }).eq("id", chapterId)

    setChapters(chapters.map((c) => (c.id === chapterId ? { ...c, title: editingChapterTitle } : c)))
    setEditingChapterId(null)
    setEditingChapterTitle("")
    router.refresh()
  }

  const handleDeleteChapter = async (chapterId: string) => {
    const supabase = createClient()

    await supabase.from("chapters").delete().eq("id", chapterId)

    setChapters(chapters.filter((c) => c.id !== chapterId))
    router.refresh()
  }

  const handleMarkChapterComplete = async (chapterId: string) => {
    const supabase = createClient()

    await supabase.from("chapters").update({ is_completed: true }).eq("id", chapterId)

    setChapters(chapters.map((c) => (c.id === chapterId ? { ...c, is_completed: true } : c)))
    router.refresh()
  }

  return (
    <div className="h-full p-6 overflow-x-auto">
      <div className="flex gap-4 h-full">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="flex-shrink-0 w-80">
            <Card className="bg-[#302831] border-[#EE9B3A]/30 h-full flex flex-col">
              <CardContent className="p-4 flex flex-col h-full">
                {/* Header do capítulo */}
                <div className="flex items-center justify-between mb-4">
                  {editingChapterId === chapter.id ? (
                    <Input
                      value={editingChapterTitle}
                      onChange={(e) => setEditingChapterTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditChapter(chapter.id)
                        if (e.key === "Escape") {
                          setEditingChapterId(null)
                          setEditingChapterTitle("")
                        }
                      }}
                      onBlur={() => handleEditChapter(chapter.id)}
                      autoFocus
                      className="bg-[#0B0A13] border-[#EE9B3A] text-[#E7D1B1]"
                    />
                  ) : (
                    <h3 className="font-semibold text-[#EE9B3A] text-lg">{chapter.title}</h3>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#E7D1B1]">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0B0A13] border-[#302831]">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingChapterId(chapter.id)
                          setEditingChapterTitle(chapter.title)
                        }}
                        className="text-[#E7D1B1] hover:bg-[#302831] cursor-pointer"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteChapter(chapter.id)}
                        className="text-red-400 hover:bg-[#302831] cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Lista de anotações */}
                <div className="flex-1 space-y-2 overflow-y-auto mb-4">
                  {entries
                    .filter((entry) => entry.chapter_id === chapter.id)
                    .map((entry) => (
                      <Link key={entry.id} href={`/adventure/${adventureId}/entry/${entry.id}`}>
                        <Card className="bg-[#0B0A13] border-[#302831] hover:border-[#EE9B3A]/50 cursor-pointer transition-colors">
                          <CardContent className="p-3">
                            <p className="text-sm text-[#E7D1B1] font-medium">{entry.title}</p>
                            {entry.description && (
                              <p className="text-xs text-[#9F8475] mt-1 line-clamp-2">{entry.description}</p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                </div>

                {/* Botões de ação */}
                <div className="space-y-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full border-[#EE9B3A]/30 text-[#EE9B3A] hover:bg-[#EE9B3A]/10 bg-transparent"
                  >
                    <Link href={`/adventure/${adventureId}/entry/new?chapter=${chapter.id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova anotação
                    </Link>
                  </Button>

                  {!chapter.is_completed && (
                    <Button
                      onClick={() => handleMarkChapterComplete(chapter.id)}
                      variant="outline"
                      size="sm"
                      className="w-full border-[#302831] text-[#9F8475] hover:bg-[#302831]"
                    >
                      FIM
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Adicionar novo capítulo */}
        <div className="flex-shrink-0 w-80">
          <Card className="bg-[#302831]/50 border-[#EE9B3A]/30 border-dashed">
            <CardContent className="p-4">
              <Input
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
                placeholder="Novo capítulo..."
                className="bg-[#0B0A13] border-[#302831] text-[#E7D1B1] placeholder:text-[#9F8475] mb-2"
              />
              <Button
                onClick={handleAddChapter}
                disabled={!newChapterTitle.trim()}
                size="sm"
                className="w-full bg-[#EE9B3A] hover:bg-[#EE9B3A]/90 text-[#0B0A13]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Capítulo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
