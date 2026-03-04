import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Clock, Utensils, Users, CreditCard, ArrowRight, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/forms';
import { Input } from '@/components/ui/forms';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { useRestaurants } from '@/hooks/useRestaurants';

export default function Index() {
  const { data: allRestaurants = [] } = useRestaurants();
  const featuredRestaurants = allRestaurants.slice(0, 6);

  const howItWorks = [
    {
      icon: Search,
      title: 'Trouvez',
      description: 'Explorez les restaurants autour de vous et consultez leurs menus.',
    },
    {
      icon: Utensils,
      title: 'Commandez',
      description: 'Choisissez vos plats et indiquez votre heure d\'arrivée.',
    },
    {
      icon: CreditCard,
      title: 'Payez',
      description: 'Réglez en ligne en toute sécurité avant votre arrivée.',
    },
    {
      icon: Clock,
      title: 'Savourez',
      description: 'Arrivez au restaurant et profitez de vos plats déjà prêts !',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-warning/70" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-warning/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Vos plats prêts
              <br />
              <span className="text-white/90">à votre arrivée</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Commandez à l'avance dans vos restaurants préférés et profitez de vos repas sans attente. L'expérience restaurant réinventée.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-2xl p-2 shadow-veat-xl flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Où voulez-vous manger ?"
                  className="pl-12 h-14 border-0 text-base bg-transparent focus-visible:ring-0"
                />
              </div>
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Restaurant, cuisine..."
                  className="pl-12 h-14 border-0 text-base bg-transparent focus-visible:ring-0"
                />
              </div>
              <Button variant="hero" size="xl" className="md:w-auto w-full">
                Rechercher
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8 md:gap-16 mt-12"
          >
            {[
              { value: '500+', label: 'Restaurants' },
              { value: '50k+', label: 'Utilisateurs' },
              { value: '4.8', label: 'Note moyenne', icon: Star },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="flex items-center justify-center gap-1 text-3xl md:text-4xl font-bold text-white">
                  {stat.icon && <stat.icon className="h-6 w-6 fill-warning text-warning" />}
                  {stat.value}
                </div>
                <div className="text-white/70 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Réservez votre repas en quelques clics et profitez d'une expérience sans attente.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-card rounded-2xl p-6 shadow-veat text-center h-full">
                  <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="font-bold text-lg text-card-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Restaurants populaires
              </h2>
              <p className="text-muted-foreground">
                Découvrez les restaurants les mieux notés près de chez vous
              </p>
            </div>
            <Link to="/restaurants">
              <Button variant="outline" className="group">
                Voir tous les restaurants
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRestaurants.map((restaurant, index) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Group Dining CTA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="relative bg-card rounded-3xl overflow-hidden shadow-veat-lg">
            <div className="absolute inset-0 gradient-hero opacity-10" />
            <div className="relative grid md:grid-cols-2 gap-8 p-8 md:p-12">
              <div className="flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium w-fit mb-4">
                  <Users className="h-4 w-4" />
                  Nouveau
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-card-foreground mb-4">
                  Mangez en groupe,
                  <br />
                  simplifiez le paiement
                </h2>
                <p className="text-muted-foreground mb-6">
                  Créez une table virtuelle, invitez vos amis et partagez l'addition facilement. Chacun paie sa part directement depuis l'app.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="hero" size="lg">
                    Créer une table
                  </Button>
                  <Button variant="outline" size="lg">
                    En savoir plus
                  </Button>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1529543544277-750e577b5b13?w=600"
                  alt="Group dining"
                  className="rounded-2xl w-full h-64 md:h-full object-cover shadow-veat-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Partner CTA */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Vous êtes restaurateur ?
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto mb-8">
              Rejoignez V'EAT et optimisez votre service. Réduisez l'attente de vos clients et augmentez vos revenus.
            </p>
            <Link to="/partner">
              <Button variant="glass" size="xl">
                Devenir partenaire
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
