FROM php:8.3.8-fpm

# Arguments defined in docker-compose.yml
ARG user
ARG uid
ARG GIT_PRIV_KEY

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libicu-dev \
    gnupg \
    unzip \
    libpq-dev \
    libjpeg-dev \
    openssh-client \
    nano \
    libfreetype6-dev

# Install PHP extensions
RUN docker-php-ext-install mbstring exif pcntl bcmath pdo_mysql zip intl
RUN docker-php-ext-configure gd --with-freetype --with-jpeg && docker-php-ext-install gd

COPY php/php.ini /usr/local/etc/php/conf.d/custom.ini

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create system user to run Composer and Artisan Commands
RUN useradd -G www-data,root -u $uid -d /home/$user $user
RUN mkdir -p /home/$user/.composer && \
    mkdir -p /home/$user/.ssh/ && ssh-keyscan gitlab.1min30.tech >> /home/$user/.ssh/known_hosts && \
    chmod 644 /home/$user/.ssh/known_hosts && \
    echo "${GIT_PRIV_KEY}" > /home/$user/.ssh/id_ed25519 && \
    chmod 600 /home/$user/.ssh/id_ed25519 && \
    chown -R $user:$user /home/$user

# Install NodeJS
RUN curl -sL https://deb.nodesource.com/setup_20.x  | bash -
RUN apt-get -y install nodejs

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

RUN chown -R $user:www-data /var/www/html

# Set working directory
WORKDIR /var/www/html

# Set user
USER $user
