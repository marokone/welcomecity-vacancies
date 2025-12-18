// Configuration Module
window.appConfig = {
    supabase: {
        url: 'https://vhbiezamhpyejdqvvwuj.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYmllemFtaHB5ZWpkcXZ2d3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Njc0MDgsImV4cCI6MjA3NzI0MzQwOH0.13h_XJ7kQFtuCjavkOXN9TzXNF2X4jX5-rcNCFiFqO0'
    },
    environment: {
        isTilda: window.location.hostname.includes('welcomecity.ru'),
        isGitHubPages: window.location.hostname.includes('github.io')
    },
    features: {
        modalDetails: true,
        realtimeUpdates: true,
        caching: true
    }
};
