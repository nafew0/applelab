from django.urls import path

from . import admin_views as v

app_name = "catalog_admin"

urlpatterns = [
    path("catalog/families/", v.FamilyListCreateView.as_view(), name="families"),
    path("catalog/families/reorder/", v.FamilyReorderView.as_view(), name="families-reorder"),
    path("catalog/families/<int:family_id>/", v.FamilyDetailView.as_view(), name="family-detail"),
    path("catalog/models/", v.ModelListCreateView.as_view(), name="models"),
    path("catalog/models/<int:model_id>/", v.ModelDetailView.as_view(), name="model-detail"),
    path("catalog/models/<int:model_id>/duplicate/", v.ModelDuplicateView.as_view(), name="model-duplicate"),
    path("catalog/models/<int:model_id>/apply-issues/", v.ModelApplyIssuesView.as_view(), name="model-apply-issues"),
    path("catalog/models/<int:model_id>/offerings/", v.ModelOfferingsView.as_view(), name="model-offerings"),
    path("catalog/offerings/<int:offering_id>/", v.OfferingDetailView.as_view(), name="offering-detail"),
    path("catalog/issues/", v.IssueListCreateView.as_view(), name="issues"),
    path("catalog/issues/<int:issue_id>/", v.IssueDetailView.as_view(), name="issue-detail"),
    path("catalog/matrix/", v.MatrixView.as_view(), name="matrix"),
]
