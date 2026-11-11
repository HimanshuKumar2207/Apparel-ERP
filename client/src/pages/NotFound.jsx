import { Compass, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { EmptyState } from '../components/ui/Misc';

export const NotFound = () => (
  <EmptyState icon={Compass} title="Page not found" message="The page you are looking for does not exist." action={<Link to="/"><Button>Back to dashboard</Button></Link>} />
);
export const Forbidden = () => (
  <EmptyState icon={Lock} title="You do not have access" message="Ask a Super Admin if you need access to this area." action={<Link to="/"><Button variant="secondary">Back to dashboard</Button></Link>} />
);
