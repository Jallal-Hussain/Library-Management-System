"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface KeywordInputProps {
  keywords: string[]
  onChange: (keywords: string[]) => void
  suggestions?: string[]
  placeholder?: string
}

const defaultSuggestions = [
  "fiction",
  "non-fiction",
  "science",
  "history",
  "biography",
  "autobiography",
  "mystery",
  "thriller",
  "romance",
  "fantasy",
  "sci-fi",
  "horror",
  "comedy",
  "drama",
  "philosophy",
  "psychology",
  "business",
  "technology",
  "programming",
  "design",
  "art",
  "music",
  "cooking",
  "travel",
  "education",
  "reference",
]

export function KeywordInput({ keywords, onChange, suggestions = defaultSuggestions, placeholder = "Add keywords..." }: KeywordInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [open, setOpen] = useState(false)

  const handleAddKeyword = (keyword: string) => {
    const trimmedKeyword = keyword.trim().toLowerCase()
    if (trimmedKeyword && !keywords.includes(trimmedKeyword)) {
      onChange([...keywords, trimmedKeyword])
      setInputValue("")
      setOpen(false)
    }
  }

  const handleRemoveKeyword = (keywordToRemove: string) => {
    onChange(keywords.filter((k) => k !== keywordToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault()
      handleAddKeyword(inputValue)
    } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
      handleRemoveKeyword(keywords[keywords.length - 1])
    }
  }

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) && !keywords.includes(suggestion.toLowerCase()),
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[42px] p-2 border rounded-md bg-background">
        {keywords.map((keyword) => (
          <Badge key={keyword} variant="secondary" className="flex items-center gap-1 pr-1">
            {keyword}
            <button
              type="button"
              onClick={() => handleRemoveKeyword(keyword)}
              className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setOpen(true)}
              placeholder={keywords.length === 0 ? placeholder : ""}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto min-w-[150px] flex-1"
            />
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search keywords..." value={inputValue} />
              <CommandList>
                <CommandEmpty>No keywords found.</CommandEmpty>
                <CommandGroup>
                  {filteredSuggestions.slice(0, 10).map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      onSelect={() => handleAddKeyword(suggestion)}
                      className="cursor-pointer"
                    >
                      {suggestion}
                    </CommandItem>
                  ))}
                  {inputValue.trim() && !filteredSuggestions.includes(inputValue.trim()) && (
                    <CommandItem
                      onSelect={() => handleAddKeyword(inputValue)}
                      className="cursor-pointer text-primary"
                    >
                      Add "{inputValue.trim()}"
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-xs text-muted-foreground">Press Enter to add keywords. Click X to remove.</p>
    </div>
  )
}


