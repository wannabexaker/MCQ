FROM nginx:alpine

# Static site: copy only the files the app needs into the Nginx web root.
COPY index.html /usr/share/nginx/html/index.html
COPY js/ /usr/share/nginx/html/js/
COPY style.css /usr/share/nginx/html/style.css
COPY sources_index.json /usr/share/nginx/html/sources_index.json
COPY questions_template.json /usr/share/nginx/html/questions_template.json
COPY q_*.json /usr/share/nginx/html/
COPY images/ /usr/share/nginx/html/images/

# Minimal Nginx config for static assets + no directory listing.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
