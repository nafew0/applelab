from django.urls import path

from . import views

app_name = "catalog"

urlpatterns = [
    # Browser-facing cascades (proxied by Next)
    path("families/", views.FamilyListView.as_view(), name="families"),
    path("years/", views.YearListView.as_view(), name="years"),
    path("models/", views.ModelListView.as_view(), name="models"),
    path("issues/", views.IssueListView.as_view(), name="issues"),
    # Server-only page data (NOT proxied to browsers)
    path("pages/index/", views.IndexPageView.as_view(), name="page-index"),
    path("pages/family/<slug:family>/", views.FamilyPageView.as_view(), name="page-family"),
    path("pages/model/<slug:family>/<slug:model>/", views.ModelPageView.as_view(), name="page-model"),
    path(
        "pages/offering/<slug:family>/<slug:model>/<slug:issue>/",
        views.OfferingPageView.as_view(),
        name="page-offering",
    ),
    path("pages/sitemap/", views.SitemapDataView.as_view(), name="page-sitemap"),
]
