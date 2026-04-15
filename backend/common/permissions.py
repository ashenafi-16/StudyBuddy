from rest_framework import permissions

class IsGroupMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'group'):
            return obj.group.members.filter(user=request.user, is_active=True).exists()
        return False
    
class IsGroupAdminOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if hasattr(obj, 'group'):
            return obj.group.created_by == request.user
        return False

class IsGroupMemberOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return obj.members.filter(user=request.user, is_active=True).exists()
        return obj.created_by == request.user

class IsTaskOwnerOrGroupMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.assigned_to == request.user:
            return True
        
        if request.method in permissions.SAFE_METHODS:
            if obj.group:
                return obj.group.members.filter(user=request.user, is_active=True).exists()
        return False