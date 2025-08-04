import type { User } from "../db/schema.js";

interface UserProfileProps {
  user: User;
  id?: string;
}

export function UserProfile({ user, id = "user-profile" }: UserProfileProps) {
  return (
    <sapling-island loading="visible">
      <template>
        <script type="module" src="/components/UserProfile.js"></script>
      </template>
      
      <div id={id} class="relative" data-user-name={user.name} data-user-email={user.email} data-user-avatar={user.avatarUrl}>
        {/* Profile button */}
        <button 
          id={`${id}-button`}
          class="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="User profile menu"
        >
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name}
              class="w-full h-full object-cover"
            />
          ) : (
            <div class="w-full h-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </button>

        {/* Dropdown popup - hidden by default */}
        <div 
          id={`${id}-popup`}
          class="hidden absolute right-0 top-12 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
        >
          {/* Profile info section */}
          <div class="p-4 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name}
                    class="w-full h-full object-cover"
                  />
                ) : (
                  <div class="w-full h-full bg-gray-400 flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-gray-900 truncate">{user.name}</h3>
                <p class="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Actions section */}
          <div class="p-2">
            <form action="/auth/logout" method="post" class="w-full">
              <button 
                type="submit"
                class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-150 flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </sapling-island>
  );
}