import { useApp } from "@/lib/app-state";
import { formatCurrency, formatCurrencyK } from "@/lib/utils";
import { useMemo } from "react";
import { Bell, Heart, MessageCircle, Repeat2, MoreHorizontal, Verified } from "lucide-react";
import Web3News from "@/components/Web3News";

export default function Notifications() {
  const { assets } = useApp();

  const notifications = useMemo(() => {
    const huntNotifications = assets.slice(0, 8).map((asset, index) => {
      const marketOnly = Boolean(asset.secondaryMarket?.active);
      const notificationType = marketOnly ? 3 : index % 4;
      const hoursAgo = Math.max(1, ((index + 1) * 3 + asset.cycle.cycle) % 24);
      return {
        id: `${asset.id}-${index}`,
        type: notificationType === 0 ? 'purchased_hunt' : 
              notificationType === 1 ? 'new_hunt' : 
              notificationType === 2 ? 'hunt_ending' : (marketOnly ? 'market_phase' : 'platform_update'),
        asset,
        title: notificationType === 0 ? 'Hunt Ready' :
               notificationType === 1 ? 'New Hunt Available' :
               notificationType === 2 ? 'Hunt Ending Soon' : (marketOnly ? 'Market Phase Active' : 'Platform Update'),
        content: notificationType === 0 
          ? `Your CoinTags for ${asset.name} are ready! Hunt cycle ${asset.cycle.cycle} has begun with ${formatCurrencyK(asset.cycle.reserve)} liquidity.`
          : notificationType === 1
          ? `New hunt opportunity: ${asset.name} cycle ${asset.cycle.cycle} is now available. ${formatCurrencyK(asset.cycle.reserve)} in liquidity rewards.`
          : notificationType === 2
          ? `${asset.name} hunt cycle ${asset.cycle.cycle} ends in 6 hours. Last chance to use your CoinTags!`
          : marketOnly
          ? `${asset.name} has moved into market-only trading. WALV now anchors token pricing and redemptions are closed.`
          : `Platform maintenance scheduled for tomorrow 2AM UTC. All hunts will be temporarily paused.`,
        timestamp: `${hoursAgo}h`,
        metrics: {
          found: Math.max(0, asset.cycle.initialSupply - asset.cycle.supply),
          lpu: asset.secondaryMarket?.active ? asset.secondaryMarket.walv : asset.cycle.lpu,
          liquidity: asset.cycle.reserve
        },
        priority: notificationType === 0 ? 'high' : notificationType === 2 ? 'medium' : (marketOnly ? 'high' : 'normal')
      };
    });
    
    return huntNotifications;
  }, [assets]);

  const getNotificationIcon = (type: string, priority: string) => {
    const baseClasses = "h-5 w-5";
    switch (type) {
      case 'purchased_hunt': return <Bell className={`${baseClasses} text-green-500`} />;
      case 'new_hunt': return <Bell className={`${baseClasses} text-blue-500`} />;
      case 'hunt_ending': return <Bell className={`${baseClasses} text-orange-500`} />;
      case 'platform_update': return <Bell className={`${baseClasses} text-blue-500`} />;
      case 'market_phase': return <Bell className={`${baseClasses} text-blue-500`} />;
      default: return <Bell className={`${baseClasses} text-muted-foreground`} />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'high') {
      return <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>;
    }
    if (priority === 'medium') {
      return <div className="w-2 h-2 rounded-full bg-orange-500"></div>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pb-16 pt-3 sm:pt-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:gap-8">
          <aside className="hidden lg:block lg:space-y-6 lg:pt-2">
            <Web3News variant="detail" />
          </aside>

          <div className="w-full">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="border-b border-border/40 px-4 py-3 hover:bg-surface/30 transition-colors cursor-pointer"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 pt-1">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <img 
                            src={notification.asset.image} 
                            alt={notification.asset.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <span className="font-bold text-foreground text-sm">{notification.asset.name}</span>
                          <span className="text-muted-foreground text-sm">·</span>
                          <span className="text-muted-foreground text-sm">{notification.timestamp}</span>
                          {getPriorityBadge(notification.priority)}
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-2">
                          {notification.title}
                        </p>

                        <p className="text-foreground text-sm leading-relaxed mb-3">
                          {notification.content}
                        </p>

                        {(notification.type === 'purchased_hunt' || notification.type === 'new_hunt' || notification.type === 'hunt_ending') && (
                          <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                            <span>{notification.metrics.found} tokens available</span>
                            <span>LPU {formatCurrency(notification.metrics.lpu)}</span>
                            <span>Liquidity {formatCurrencyK(notification.metrics.liquidity)}</span>
                          </div>
                        )}

                        {(notification.type === 'purchased_hunt' || notification.type === 'new_hunt') && (
                          <div className="flex gap-2 mt-3">
                            <a
                              href={`/assets/${notification.asset.id}/hunt`}
                              className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors bg-black text-white hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:bg-white dark:text-black dark:hover:bg-white/90 dark:focus-visible:outline-white"
                            >
                              {notification.type === 'purchased_hunt' ? 'Start Hunt' : 'View Hunt'}
                            </a>
                            <a
                              href={`/assets/${notification.asset.id}`}
                              className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors bg-black text-white hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:bg-white dark:text-black dark:hover:bg-white/90 dark:focus-visible:outline-white"
                            >
                              Asset Details
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <div className="h-16"></div>
    </div>
  );
}
