from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from collections import deque
from .models import User, Friendship, Message
from .serializers import UserSerializer, FriendshipSerializer, MessageSerializer

class SignupView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        preferred_language = request.data.get('preferred_language', 'en')
        
        # Validation
        if not username or not email or not password:
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        if preferred_language not in ['en', 'fr', 'es']:
            preferred_language = 'en'
        
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                preferred_language=preferred_language
            )
            return Response({'message': 'User created', 'id': user.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        search = request.query_params.get('search', '').strip()
        # Exclude current user
        users = User.objects.exclude(id=request.user.id)
        
        if search:
            # Advanced search algorithm with relevance scoring
            from django.db.models import Case, When, IntegerField
            users = users.filter(
                Q(username__icontains=search) | Q(email__icontains=search)
            ).annotate(
                relevance=Case(
                    # Exact matches get highest score (100)
                    When(username__iexact=search, then=100),
                    When(email__iexact=search, then=100),
                    # Starts with gets high score (80)
                    When(username__istartswith=search, then=80),
                    When(email__istartswith=search, then=80),
                    # Contains gets medium score (50)
                    When(username__icontains=search, then=50),
                    When(email__icontains=search, then=50),
                    default=0,
                    output_field=IntegerField()
                )
            ).order_by('-relevance', 'username')
        else:
            # If no search, return all users ordered by username
            users = users.order_by('username')
        
        # Exclude users who are already friends or have pending requests
        from .models import Friendship
        friend_ids = set()
        # Get accepted friends
        friendships = Friendship.objects.filter(
            (Q(from_user=request.user) | Q(to_user=request.user)),
            accepted=True
        )
        for f in friendships:
            friend_ids.add(f.to_user.id if f.from_user == request.user else f.from_user.id)
        
        # Get pending requests (both sent and received)
        pending = Friendship.objects.filter(
            Q(from_user=request.user) | Q(to_user=request.user),
            accepted=False
        )
        for f in pending:
            friend_ids.add(f.to_user.id if f.from_user == request.user else f.from_user.id)
        
        # Add friendship status to each user
        serializer = UserSerializer(users, many=True)
        result = []
        for user_data in serializer.data:
            user_dict = dict(user_data)
            user_dict['is_friend'] = user_data['id'] in friend_ids
            # Check if there's a pending request
            user_dict['has_pending_request'] = False
            if user_data['id'] in friend_ids:
                pending_req = Friendship.objects.filter(
                    (Q(from_user=request.user, to_user_id=user_data['id']) | 
                     Q(from_user_id=user_data['id'], to_user=request.user)),
                    accepted=False
                ).first()
                user_dict['has_pending_request'] = pending_req is not None
                user_dict['request_sent_by_me'] = pending_req.from_user == request.user if pending_req else False
            result.append(user_dict)
        
        return Response(result)

class FriendsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get all friendships where user is involved and accepted
        friendships = Friendship.objects.filter(
            (Q(from_user=request.user) | Q(to_user=request.user)),
            accepted=True
        )
        serializer = FriendshipSerializer(friendships, many=True)
        # Return list of friend user objects
        friends = []
        for friendship in friendships:
            friend = friendship.to_user if friendship.from_user == request.user else friendship.from_user
            friends.append(UserSerializer(friend).data)
        return Response(friends)

class FriendRequestsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get pending friend requests sent TO the current user
        pending_requests = Friendship.objects.filter(
            to_user=request.user,
            accepted=False
        )
        
        requests_data = []
        for friendship in pending_requests:
            requests_data.append({
                'id': friendship.id,
                'from_user': UserSerializer(friendship.from_user).data,
                'timestamp': friendship.timestamp.isoformat()
            })
        
        return Response(requests_data)

class FriendRequestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if target_user == request.user:
            return Response({'error': 'Cannot send friend request to yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if friendship already exists
        existing = Friendship.objects.filter(
            (Q(from_user=request.user, to_user=target_user) | Q(from_user=target_user, to_user=request.user))
        ).first()
        
        if existing:
            if existing.accepted:
                return Response({'error': 'Already friends'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # If request exists but not accepted, accept it if from target_user
                if existing.from_user == target_user:
                    existing.accepted = True
                    existing.save()
                    return Response({'message': 'Friend request accepted'}, status=status.HTTP_200_OK)
                else:
                    return Response({'error': 'Friend request already sent'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create new friendship request
        friendship = Friendship.objects.create(
            from_user=request.user,
            to_user=target_user,
            accepted=False
        )
        
        # Send WebSocket notification to target user
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f'user_{target_user.id}',
                {
                    'type': 'friend_request_notification',
                    'message': {
                        'type': 'friend_request',
                        'from_user': UserSerializer(request.user).data,
                        'friendship_id': friendship.id,
                    }
                }
            )
        
        return Response({'message': 'Friend request sent'}, status=status.HTTP_201_CREATED)

class MessagesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, friend_id):
        try:
            friend = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response({'error': 'Friend not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if users are friends
        friendship = Friendship.objects.filter(
            (Q(from_user=request.user, to_user=friend) | Q(from_user=friend, to_user=request.user)),
            accepted=True
        ).first()
        
        if not friendship:
            return Response({'error': 'Users are not friends'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get messages between users
        messages = Message.objects.filter(
            (Q(sender=request.user, receiver=friend) | Q(sender=friend, receiver=request.user))
        ).order_by('timestamp')
        
        serializer = MessageSerializer(messages, many=True)
        # Add display content based on sender
        data = []
        for msg in serializer.data:
            msg_data = dict(msg)
            if msg['sender']['id'] == request.user.id:
                msg_data['displayContent'] = msg['content']
            else:
                msg_data['displayContent'] = msg['translated_content']
            data.append(msg_data)
        
        return Response(data)

class FriendRecommendationsView(APIView):
    """
    BFS-based friend recommendation algorithm.
    Finds friends-of-friends who aren't already friends or have pending requests.
    Uses Breadth-First Search to traverse the friendship graph.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from collections import defaultdict
        
        user = request.user
        max_depth = 2  # Friends of friends (distance 2)
        max_recommendations = 10
        
        # Build adjacency list for friendship graph
        # Get all accepted friendships
        friendships = Friendship.objects.filter(accepted=True)
        
        # Create graph: user_id -> set of friend_ids
        graph = defaultdict(set)
        for friendship in friendships:
            graph[friendship.from_user.id].add(friendship.to_user.id)
            graph[friendship.to_user.id].add(friendship.from_user.id)
        
        # Get users to exclude (already friends, pending requests, or self)
        exclude_ids = {user.id}
        
        # Add direct friends
        if user.id in graph:
            exclude_ids.update(graph[user.id])
        
        # Add users with pending requests
        pending = Friendship.objects.filter(
            Q(from_user=user) | Q(to_user=user),
            accepted=False
        )
        for f in pending:
            exclude_ids.add(f.to_user.id if f.from_user == user else f.from_user.id)
        
        # BFS Algorithm to find friends-of-friends
        # Queue: (user_id, depth, mutual_friends_count)
        queue = deque([(user.id, 0)])
        visited = {user.id}
        recommendations = defaultdict(int)  # user_id -> mutual friends count
        
        while queue:
            current_user_id, depth = queue.popleft()
            
            # Only traverse up to max_depth
            if depth >= max_depth:
                continue
            
            # Get neighbors (friends) of current user
            if current_user_id not in graph:
                continue
            
            for friend_id in graph[current_user_id]:
                # Skip if already visited or excluded
                if friend_id in exclude_ids:
                    continue
                
                # If at depth 1 (friend), continue BFS to find their friends
                if depth == 0:
                    # This is a direct friend, explore their friends
                    if friend_id not in visited:
                        visited.add(friend_id)
                        queue.append((friend_id, depth + 1))
                
                # If at depth 1 (we're exploring a friend's friends)
                elif depth == 1:
                    # This is a friend-of-friend (recommendation candidate)
                    if friend_id not in exclude_ids:
                        # Count mutual friends
                        mutual_friends = len(graph[user.id] & graph[friend_id])
                        recommendations[friend_id] = max(recommendations[friend_id], mutual_friends)
        
        # Sort recommendations by mutual friends count (descending)
        sorted_recommendations = sorted(
            recommendations.items(),
            key=lambda x: x[1],
            reverse=True
        )[:max_recommendations]
        
        # Get user objects and serialize
        recommended_user_ids = [user_id for user_id, _ in sorted_recommendations]
        recommended_users = User.objects.filter(id__in=recommended_user_ids)
        
        # Create a map for mutual friends count
        mutual_friends_map = dict(sorted_recommendations)
        
        serializer = UserSerializer(recommended_users, many=True)
        result = []
        for user_data in serializer.data:
            user_dict = dict(user_data)
            user_dict['mutual_friends_count'] = mutual_friends_map.get(user_data['id'], 0)
            result.append(user_dict)
        
        # Sort result to maintain order by mutual friends
        result.sort(key=lambda x: x['mutual_friends_count'], reverse=True)
        
        return Response({
            'recommendations': result,
            'algorithm': 'BFS (Breadth-First Search)',
            'description': 'Finds friends-of-friends using graph traversal, ranked by mutual friends'
        })