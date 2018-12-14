from django.conf.urls import url, handler404, patterns, include
from django.contrib import admin
from django.conf import settings
from django.views.generic.base import TemplateView
from django.views.static import serve
from django.views.decorators.cache import cache_control
from django.http import HttpResponseServerError
from django.template import loader, RequestContext
from rooibos.ui.views import main
from rooibos.access.views import login, logout
from rooibos.legacy.views import legacy_viewer
from rooibos.version import VERSION


admin.autodiscover()

apps = filter(lambda a: a.startswith('apps.'), settings.INSTALLED_APPS)
apps_showcases = list(s[5:].replace('.', '-') + '-showcase.html' for s in apps)

# Cache static files
serve = cache_control(max_age=365 * 24 * 3600)(serve)


def handler500_with_context(request):
    template = loader.get_template('500.html')
    return HttpResponseServerError(template.render(RequestContext(request)))


handler404 = getattr(settings, 'HANDLER404', handler404)
handler500 = getattr(settings, 'HANDLER500', handler500_with_context)


def raise_exception():
    raise Exception()


class ShowcasesView(TemplateView):

    def get_context_data(self, **kwargs):
        context = super(ShowcasesView, self).get_context_data(**kwargs)
        context.update({
            'applications': apps_showcases,
        })
        return context


urls = [
    url(r'^$', main, {'HELP': 'frontpage'}, name='main'),
    url(
        r'^about/',
        TemplateView.as_view(template_name='about.html'),
        kwargs={'version': VERSION},
        name='about'
    ),
    url(
        r'^showcases/',
        ShowcasesView.as_view(template_name='showcases.html'),
        name='showcases'
    ),

    (r'^admin/', include(admin.site.urls)),

    # Legacy URL for presentation viewer in earlier version
    url(r'^viewers/view/(?P<record>\d+)/.+/$', legacy_viewer),

    (r'^ui/', include('rooibos.ui.urls')),
    (r'^acl/', include('rooibos.access.urls')),
    (r'^explore/', include('rooibos.solr.urls')),
    (r'^media/', include('rooibos.storage.urls')),
    (r'^data/', include('rooibos.data.urls')),
    (r'^legacy/', include('rooibos.legacy.urls')),
    (r'^presentation/', include('rooibos.presentation.urls')),
    (r'^viewers/', include('rooibos.viewers.urls')),
    (r'^workers/', include('rooibos.workers.urls')),
    (r'^api/', include('rooibos.api.urls')),
    (r'^profile/', include('rooibos.userprofile.urls')),
    (r'^federated/', include('rooibos.federatedsearch.urls')),
    (r'^flickr/', include('rooibos.federatedsearch.flickr.urls')),
    (r'^artstor/', include('rooibos.federatedsearch.artstor.urls')),
    (r'^shared/', include('rooibos.federatedsearch.shared.urls')),
    (r'^impersonate/', include('impersonate.urls')),
    (r'^works/', include('rooibos.works.urls')),
    (r'^mediaviewer/', include('rooibos.mediaviewer.urls')),
    (r'^pdfviewer/', include('rooibos.pdfviewer.urls')),
    (r'^pptexport/', include('rooibos.pptexport.urls')),

    url(
        r'^favicon.ico$',
        serve,
        {
            'document_root': settings.STATIC_ROOT,
            'path': 'images/favicon.ico'
        }
    ),
    url(
        r'^robots.txt$',
        serve,
        {
            'document_root': settings.STATIC_ROOT,
            'path': 'robots.txt'
        }
    ),
    url(
        r'^static/(?P<path>.*)$',
        serve,
        {
            'document_root': settings.STATIC_ROOT
        },
        name='static'
    ),

    url(r'^exception/$', raise_exception),
]

try:
    import django_shibboleth  # noqa
    urls.append(
        (r'^shibboleth/', include('django_shibboleth.urls')),
    )
except ImportError:
    pass


if getattr(settings, 'CAS_SERVER_URL', None):
    urls += [
        url(
            r'^login/$',
            'django_cas_ng.views.login',
            {
                'HELP': 'logging-in',
            },
            name='login'
        ),
        url(
            r'^local-login/$',
            login,
            {
                'HELP': 'logging-in',
            },
            name='local-login'
        ),
        url(
            r'^logout/$',
            'django_cas_ng.views.logout',
            {
                'HELP': 'logging-out',
                'next_page': settings.LOGOUT_URL
            },
            name='logout'
        ),
    ]
else:
    urls += [
        url(
            r'^login/$',
            login,
            {
                'HELP': 'logging-in',
            },
            name='login'
        ),
        url(
            r'^logout/$',
            logout,
            {
                'HELP': 'logging-out',
                'next_page': settings.LOGOUT_URL
            },
            name='logout'
        ),
    ]

for app in apps:
    if '.' not in app[5:]:
        urls.append(url(r'^%s/' % app[5:], include('%s.urls' % app)))


urlpatterns = patterns('', *urls)
