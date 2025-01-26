import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-center items-center space-x-4 text-sm text-muted-foreground">
          <Link to="/impressum" className="hover:text-foreground transition-colors">
            Impressum
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;