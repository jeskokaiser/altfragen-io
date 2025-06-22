
import { Moon, Sun } from "lucide-react";
import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { ThemeContext } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
