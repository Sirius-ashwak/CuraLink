import React from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'wouter';

// Navigation item interface
interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

// Sidebar navigation props
interface SidebarNavProps {
  items: NavItem[];
  className?: string;
}

export const LightThemeSidebarNav: React.FC<SidebarNavProps> = ({ 
  items, 
  className 
}) => {
  const [location] = useLocation();
  
  return (
    <nav className={cn("space-y-1", className)}>
      {items.map((item, index) => {
        const isActive = location === item.href;
        
        return (
          <Link 
            key={index} 
            href={item.href}
          >
            <a
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              {item.icon && (
                <span className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-blue-500" : "text-gray-500"
                )}>
                  {item.icon}
                </span>
              )}
              
              <span>{item.label}</span>
              
              {item.badge && (
                <span className={cn(
                  "ml-auto inline-block py-0.5 px-2 text-xs rounded-full",
                  item.badgeVariant === 'primary' ? "bg-blue-100 text-blue-800" :
                  item.badgeVariant === 'success' ? "bg-green-100 text-green-800" :
                  item.badgeVariant === 'warning' ? "bg-yellow-100 text-yellow-800" :
                  item.badgeVariant === 'danger' ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                )}>
                  {item.badge}
                </span>
              )}
            </a>
          </Link>
        );
      })}
    </nav>
  );
};

// Navbar navigation props
interface NavbarProps {
  logo?: React.ReactNode;
  logoText?: string;
  items: NavItem[];
  actionItems?: React.ReactNode[];
  className?: string;
}

export const LightThemeNavbar: React.FC<NavbarProps> = ({
  logo,
  logoText,
  items,
  actionItems,
  className
}) => {
  const [location] = useLocation();
  
  return (
    <nav className={cn(
      "bg-white border-b border-gray-200 py-2 px-4 sm:px-6 lg:px-8 shadow-sm",
      className
    )}>
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            {logo && (
              <div className="flex-shrink-0 h-8 w-8 mr-2">
                {logo}
              </div>
            )}
            {logoText && (
              <span className="text-xl font-semibold text-gray-900">
                {logoText}
              </span>
            )}
          </div>
          
          {/* Navigation items */}
          <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
            {items.map((item, index) => {
              const isActive = location === item.href;
              
              return (
                <Link 
                  key={index} 
                  href={item.href}
                >
                  <a
                    className={cn(
                      "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    {item.icon && (
                      <span className={cn(
                        "mr-2 h-5 w-5",
                        isActive ? "text-blue-500" : "text-gray-500"
                      )}>
                        {item.icon}
                      </span>
                    )}
                    
                    {item.label}
                    
                    {item.badge && (
                      <span className={cn(
                        "ml-2 inline-block py-0.5 px-2 text-xs rounded-full",
                        item.badgeVariant === 'primary' ? "bg-blue-100 text-blue-800" :
                        item.badgeVariant === 'success' ? "bg-green-100 text-green-800" :
                        item.badgeVariant === 'warning' ? "bg-yellow-100 text-yellow-800" :
                        item.badgeVariant === 'danger' ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Action items */}
        {actionItems && (
          <div className="flex items-center space-x-2">
            {actionItems.map((item, index) => (
              <div key={index}>
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};