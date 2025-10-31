
import { Link } from "react-router-dom";
import { Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-muted-foreground">
          <Link to="/impressum" className="hover:text-foreground transition-colors">
            Impressum
          </Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Datenschutz
          </Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Nutzungsbedingungen
          </Link>
          <Link to="/agb" className="hover:text-foreground transition-colors">
            AGB
          </Link>
          <Link to="/widerruf" className="hover:text-foreground transition-colors">
            Widerrufsrecht
          </Link>
          
          <a href="https://github.com/jeskokaiser/altfragen-io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center" aria-label="GitHub Repository">
            <Github size={16} className="mr-1" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
