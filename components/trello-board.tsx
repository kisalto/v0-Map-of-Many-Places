"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, MoreVertical, Pencil, Trash2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [confirmCompleteChapterId, setConfirmCompleteChapterId] = useState<string | null>(null)
  const [confirmReopenChapterId, setConfirmReopenChapterId] = useState<string | null>(null)
  const [confirmDeleteChapterId, setConfirmDeleteChapterId] = useState<string | null>(null)
  const router = useRouter()

  const handleAddChapter = async () => {
    console.log("[v0] ========== ADD CHAPTER START ==========")
    console.log("[v0] New chapter title:", newChapterTitle)

    if (!newChapterTitle.trim()) {
      console.log("[v0] Validation failed: title is empty")
      console.log("[v0] ========== ADD CHAPTER END (VALIDATION FAILED) ==========")
      return
    }

    console.log("[v0] Creating Supabase client...")
    const supabase = createClient()

    console.log("[v0] Preparing chapter data:", {
      adventure_id: adventureId,
      title: newChapterTitle,
      order_index: chapters.length,
      is_completed: false,
    })

    console.log("[v0] Inserting chapter into database...")
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

    if (error) {
      console.error("[v0] Error creating chapter:", error)
      console.log("[v0] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      console.log("[v0] ========== ADD CHAPTER END (ERROR) ==========")
      return
    }

    if (!data) {
      console.error("[v0] No chapter data returned")
      console.log("[v0] ========== ADD CHAPTER END (NO DATA) ==========")
      return
    }

    console.log("[v0] Chapter created successfully:", data)
    setChapters([...chapters, data])
    setNewChapterTitle("")
    console.log("[v0] Refreshing router...")
    router.refresh()
    console.log("[v0] ========== ADD CHAPTER END (SUCCESS) ==========")
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
    console.log("[v0] Deleting chapter:", chapterId)
    const supabase = createClient()

    const { error } = await supabase.from("chapters").delete().eq("id", chapterId)

    if (error) {
      console.error("[v0] Error deleting chapter:", error)
      alert("Erro ao deletar capítulo")
      return
    }

    console.log("[v0] Chapter deleted successfully")
    setChapters(chapters.filter((c) => c.id !== chapterId))
    setEntries(entries.filter((e) => e.chapter_id !== chapterId))
    setConfirmDeleteChapterId(null)
    router.refresh()
  }

  const handleMarkChapterComplete = async (chapterId: string) => {
    const supabase = createClient()

    await supabase.from("chapters").update({ is_completed: true }).eq("id", chapterId)

    setChapters(chapters.map((c) => (c.id === chapterId ? { ...c, is_completed: true } : c)))
    setConfirmCompleteChapterId(null)
    router.refresh()
  }

  const handleReopenChapter = async (chapterId: string) => {
    const supabase = createClient()

    await supabase.from("chapters").update({ is_completed: false }).eq("id", chapterId)

    setChapters(chapters.map((c) => (c.id === chapterId ? { ...c, is_completed: false } : c)))
    setConfirmReopenChapterId(null)
    router.refresh()
  }

  return (
    <>
      <div className="h-full p-6 overflow-x-auto">
        <div className="flex gap-4 h-full">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="flex-shrink-0 w-80">
              <Card className="bg-[var(--color-chapter-card)] border-[var(--color-header-border)]/30 h-full flex flex-col">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 gap-2">
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
                        className="bg-background border-primary text-foreground text-center"
                      />
                    ) : (
                      <h3 className="font-semibold text-primary text-lg flex-1 text-center">{chapter.title}</h3>
                    )}

                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-foreground hover:bg-primary/30 hover:text-primary flex-shrink-0 transition-all"
                          onClick={(e) => {
                            console.log("[v0] Dropdown menu button clicked for chapter:", chapter.id)
                            console.log("[v0] Button element:", e.currentTarget)
                          }}
                        >
                          <MoreVertical className="h-6 w-6" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="bg-background border-border z-[100]"
                        align="end"
                        sideOffset={8}
                        onOpenAutoFocus={(e) => {
                          console.log("[v0] Dropdown opened for chapter:", chapter.id)
                        }}
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            console.log("[v0] Edit chapter clicked:", chapter.id)
                            setEditingChapterId(chapter.id)
                            setEditingChapterTitle(chapter.title)
                          }}
                          className="text-foreground hover:bg-muted cursor-pointer focus:bg-muted focus:text-primary"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            console.log("[v0] Delete chapter clicked:", chapter.id)
                            setConfirmDeleteChapterId(chapter.id)
                          }}
                          className="text-destructive hover:bg-muted cursor-pointer focus:bg-muted focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deletar Capítulo e Anotações
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto mb-4">
                    {entries
                      .filter((entry) => entry.chapter_id === chapter.id)
                      .map((entry) => (
                        <Link key={entry.id} href={`/adventure/${adventureId}/entry/${entry.id}`}>
                          <Card className="bg-[var(--color-entry-card)] border-border hover:border-primary/50 cursor-pointer transition-colors">
                            <CardContent className="p-3 text-center">
                              <p className="text-sm text-foreground font-medium">{entry.title}</p>
                              {entry.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.description}</p>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                  </div>

                  <div className="space-y-2">
                    {!chapter.is_completed ? (
                      <>
                        <Button
                          onClick={() => {
                            console.log("[v0] Navigating to create task for chapter:", chapter.id)
                            console.log("[v0] URL:", `/adventure/${adventureId}/entry/new?chapter=${chapter.id}`)
                          }}
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full border-primary/30 text-primary hover:bg-primary/10 bg-transparent"
                        >
                          <Link href={`/adventure/${adventureId}/entry/new?chapter=${chapter.id}`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova anotação
                          </Link>
                        </Button>

                        <Button
                          onClick={() => setConfirmCompleteChapterId(chapter.id)}
                          variant="outline"
                          size="sm"
                          className="w-full border-border text-muted-foreground hover:bg-muted"
                        >
                          FIM
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => setConfirmReopenChapterId(chapter.id)}
                        variant="outline"
                        size="sm"
                        className="w-full border-primary/30 text-primary hover:bg-primary/10 bg-transparent"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Reabrir Capítulo
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}

          <div className="flex-shrink-0 w-80">
            <Card className="bg-card/50 border-primary/30 border-dashed">
              <CardContent className="p-4">
                <Input
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
                  placeholder="Novo capítulo..."
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground mb-2"
                />
                <Button
                  onClick={handleAddChapter}
                  disabled={!newChapterTitle.trim()}
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Capítulo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={!!confirmCompleteChapterId} onOpenChange={() => setConfirmCompleteChapterId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground">Finalizar Capítulo?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Ao marcar este capítulo como finalizado, você não poderá adicionar mais anotações. Você pode reabrir o
              capítulo depois se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmCompleteChapterId && handleMarkChapterComplete(confirmCompleteChapterId)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmReopenChapterId} onOpenChange={() => setConfirmReopenChapterId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground">Reabrir Capítulo?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Ao reabrir este capítulo, você poderá adicionar novas anotações novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmReopenChapterId && handleReopenChapter(confirmReopenChapterId)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Reabrir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDeleteChapterId} onOpenChange={() => setConfirmDeleteChapterId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground">Deletar Capítulo?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta ação não pode ser desfeita. Isso vai deletar permanentemente o capítulo e todas as anotações dentro
              dele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteChapterId && handleDeleteChapter(confirmDeleteChapterId)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
